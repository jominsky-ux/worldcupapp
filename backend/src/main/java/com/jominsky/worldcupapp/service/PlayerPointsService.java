package com.jominsky.worldcupapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.jominsky.worldcupapp.dto.AthleteDto;
import com.jominsky.worldcupapp.model.PlayerMatchStats;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import com.jominsky.worldcupapp.provider.espn.EspnApiClient;
import com.jominsky.worldcupapp.repository.PlayerMatchStatsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PlayerPointsService {

    private static final Logger log = LoggerFactory.getLogger(PlayerPointsService.class);

    // ESPN omits seconds in some date strings: "2026-06-11T19:00Z" vs "2026-06-11T19:00:00Z"
    private static final DateTimeFormatter ESPN_DATE_FORMATTER = new DateTimeFormatterBuilder()
            .appendPattern("yyyy-MM-dd'T'HH:mm")
            .optionalStart().appendPattern(":ss").optionalEnd()
            .appendOffsetId()
            .toFormatter();

    // FPL-style point values
    private static final int PTS_PLAYED_FULL         =  2;
    private static final int PTS_PLAYED_PARTIAL      =  1;
    private static final int PTS_GOAL_GK_DEF         =  6;
    private static final int PTS_GOAL_MID            =  5;
    private static final int PTS_GOAL_FWD            =  4;
    private static final int PTS_ASSIST              =  3;
    private static final int PTS_CLEAN_SHEET_GK_DEF  =  4;
    private static final int PTS_CLEAN_SHEET_MID     =  1;
    private static final int PTS_YELLOW_CARD         = -1;
    private static final int PTS_RED_CARD            = -3;
    private static final int PTS_SAVES_PER_3                    =  1;
    private static final int PTS_OWN_GOAL                       = -2;
    private static final int PTS_DEFENSIVE_INTERVENTIONS        =  2;
    private static final int DEFENSIVE_INTERVENTIONS_THRESHOLD  = 10;

    // Re-process a completed match for up to 3 hours after kickoff to pick up
    // any ESPN stat corrections; skip after that as the data is effectively final.
    private static final long REPROCESS_WINDOW_HOURS = 3;

    private static final Map<String, String> ESPN_POSITION_MAP = Map.of(
            "Goalkeeper", "GK",
            "Defender",   "DEF",
            "Midfielder", "MID",
            "Forward",    "FWD",
            "Attacker",   "FWD"
    );

    // 2026 World Cup Final is July 19 — stop polling the day after.
    private static final Instant TOURNAMENT_END = Instant.parse("2026-07-20T00:00:00Z");

    private final PlayerMatchStatsRepository repository;
    private final EspnApiClient espnApiClient;
    private final WorldCupDataProvider dataProvider;

    public PlayerPointsService(PlayerMatchStatsRepository repository,
                               EspnApiClient espnApiClient,
                               WorldCupDataProvider dataProvider) {
        this.repository    = repository;
        this.espnApiClient = espnApiClient;
        this.dataProvider  = dataProvider;
    }

    // ── Scheduled sync ────────────────────────────────────────────────────────

    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void syncCompletedMatchStats() {
        if (Instant.now().isAfter(TOURNAMENT_END)) {
            log.info("Tournament ended — player stats sync disabled");
            return;
        }
        log.info("Player stats sync starting");
        try {
            Map<String, String> positionByAthleteId = buildPositionLookup();
            if (positionByAthleteId.isEmpty()) {
                log.warn("Player stats sync: no athletes found from ESPN roster — skipping");
                return;
            }
            log.info("Player stats sync: {} athletes in position lookup", positionByAthleteId.size());

            JsonNode events = espnApiClient.fetchCoreEvents();
            int total = 0, processed = 0, skipped = 0;
            for (JsonNode item : events.path("events")) {
                String eventId = item.path("id").asText("");
                if (eventId.isEmpty()) continue;
                total++;
                if (processEvent(eventId, positionByAthleteId)) processed++;
                else skipped++;
            }
            log.info("Player stats sync complete — {} total events, {} processed, {} skipped",
                    total, processed, skipped);
        } catch (Exception e) {
            log.error("Player stats sync failed", e);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Returns true if the event was processed (stats written/updated), false if skipped.
     */
    private boolean processEvent(String eventId, Map<String, String> positionLookup) {
        try {
            JsonNode competition = espnApiClient.fetchCoreCompetition(eventId);

            String dateText = competition.path("date").asText("");
            if (dateText.isEmpty()) {
                log.warn("Event {}: no 'date' field in ESPN competition response — full response keys: {}",
                        eventId, competition.fieldNames());
                return false;
            }

            Instant matchStart;
            try {
                matchStart = OffsetDateTime.parse(dateText, ESPN_DATE_FORMATTER).toInstant();
            } catch (Exception e) {
                log.warn("Event {}: could not parse date '{}' — {}", eventId, dateText, e.getMessage());
                return false;
            }

            Instant completedAfter = matchStart.plus(120, ChronoUnit.MINUTES);
            if (Instant.now().isBefore(completedAfter)) {
                return false; // match not finished yet
            }

            // Skip matches older than REPROCESS_WINDOW_HOURS if stats already exist —
            // ESPN data is effectively final by then and re-fetching wastes API quota.
            Instant reprocessCutoff = matchStart.plus(REPROCESS_WINDOW_HOURS, ChronoUnit.HOURS);
            if (Instant.now().isAfter(reprocessCutoff) && repository.existsByEventId(eventId)) {
                return false;
            }

            log.info("Event {}: processing player stats (kickoff {})", eventId, dateText);
            int saved = 0;
            for (JsonNode competitor : competition.path("competitors")) {
                String teamId = competitor.path("id").asText("");
                if (teamId.isEmpty()) continue;
                saved += processTeam(eventId, teamId, positionLookup);
            }
            log.info("Event {}: wrote/updated {} player stat records", eventId, saved);
            return true;

        } catch (Exception e) {
            log.warn("Event {}: failed to process — {}", eventId, e.getMessage());
            return false;
        }
    }

    /** Returns the number of player stat records saved/updated for this team. */
    private int processTeam(String eventId, String teamId, Map<String, String> positionLookup) {
        int saved = 0;
        try {
            JsonNode roster = espnApiClient.fetchCoreCompetitorRoster(eventId, teamId);
            JsonNode entries = roster.path("entries");
            if (entries.isMissingNode() || entries.isEmpty()) {
                log.warn("Event {}, team {}: roster 'entries' is empty — response keys: {}",
                        eventId, teamId, roster.fieldNames());
                return 0;
            }

            for (JsonNode entry : entries) {
                String athleteId = String.valueOf(entry.path("playerId").asLong());
                if ("0".equals(athleteId)) continue;

                try {
                    JsonNode statsRoot = espnApiClient.fetchCorePlayerStats(eventId, teamId, athleteId);
                    Map<String, Integer> stats = flattenStats(statsRoot);

                    if (stats.isEmpty()) {
                        log.debug("Event {}, athlete {}: no stats in response", eventId, athleteId);
                        continue;
                    }

                    int minutes = stats.getOrDefault("minutes", 0);
                    if (minutes == 0) continue; // did not appear

                    String position = positionLookup.getOrDefault(athleteId, "MID");
                    PlayerMatchStats pms = repository
                            .findByAthleteIdAndEventId(athleteId, eventId)
                            .orElse(new PlayerMatchStats());
                    pms.setAthleteId(athleteId);
                    pms.setEventId(eventId);
                    pms.setPosition(position);
                    pms.setMinutes(minutes);
                    pms.setGoals(stats.getOrDefault("totalGoals", 0));
                    pms.setAssists(stats.getOrDefault("goalAssists", 0));
                    pms.setCleanSheet(stats.getOrDefault("goalsConceded", 1) == 0);
                    pms.setYellowCards(stats.getOrDefault("yellowCards", 0));
                    pms.setRedCards(stats.getOrDefault("redCards", 0));
                    pms.setSaves(stats.getOrDefault("saves", 0));
                    pms.setDefensiveInterventions(stats.getOrDefault("defensiveInterventions", 0));
                    pms.setOwnGoals(stats.getOrDefault("ownGoals", 0));
                    pms.setTotalPoints(calculatePoints(pms));
                    repository.save(pms);
                    saved++;

                } catch (Exception e) {
                    log.warn("Event {}, athlete {}: failed to process stats — {}",
                            eventId, athleteId, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Event {}, team {}: failed to fetch roster — {}", eventId, teamId, e.getMessage());
        }
        return saved;
    }

    private int calculatePoints(PlayerMatchStats s) {
        int pts = 0;
        String pos = s.getPosition();

        if (s.getMinutes() >= 60) pts += PTS_PLAYED_FULL;
        else if (s.getMinutes() > 0) pts += PTS_PLAYED_PARTIAL;

        int goalPts = switch (pos) {
            case "GK", "DEF" -> PTS_GOAL_GK_DEF;
            case "MID"       -> PTS_GOAL_MID;
            default          -> PTS_GOAL_FWD;
        };
        pts += s.getGoals() * goalPts;
        pts += s.getAssists() * PTS_ASSIST;

        if (s.isCleanSheet() && s.getMinutes() >= 60) {
            pts += switch (pos) {
                case "GK", "DEF" -> PTS_CLEAN_SHEET_GK_DEF;
                case "MID"       -> PTS_CLEAN_SHEET_MID;
                default          -> 0;
            };
        }

        pts += s.getYellowCards() * PTS_YELLOW_CARD;
        pts += s.getRedCards()    * PTS_RED_CARD;

        if ("GK".equals(pos)) {
            pts += (s.getSaves() / 3) * PTS_SAVES_PER_3;
        }

        if (!"GK".equals(pos) && s.getDefensiveInterventions() >= DEFENSIVE_INTERVENTIONS_THRESHOLD) {
            pts += PTS_DEFENSIVE_INTERVENTIONS;
        }

        pts += s.getOwnGoals() * PTS_OWN_GOAL;

        return pts;
    }

    private Map<String, String> buildPositionLookup() {
        List<AthleteDto> athletes = dataProvider.getAllTeamAthletes();
        Map<String, String> lookup = new HashMap<>(athletes.size());
        for (AthleteDto a : athletes) {
            String pos = ESPN_POSITION_MAP.getOrDefault(a.position(), "MID");
            lookup.put(a.id(), pos);
        }
        return lookup;
    }

    private Map<String, Integer> flattenStats(JsonNode statsRoot) {
        Map<String, Integer> map = new HashMap<>();
        for (JsonNode category : statsRoot.path("splits").path("categories")) {
            for (JsonNode stat : category.path("stats")) {
                map.put(stat.path("name").asText(), stat.path("value").asInt(0));
            }
        }
        return map;
    }

}
