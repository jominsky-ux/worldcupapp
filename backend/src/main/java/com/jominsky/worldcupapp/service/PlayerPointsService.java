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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
    private static final int PTS_PLAYED_FULL    =  2;  // 60+ minutes
    private static final int PTS_PLAYED_PARTIAL =  1;  // any minutes, < 60
    private static final int PTS_GOAL_GK_DEF    =  6;
    private static final int PTS_GOAL_MID       =  5;
    private static final int PTS_GOAL_FWD       =  4;
    private static final int PTS_ASSIST         =  3;
    private static final int PTS_CLEAN_SHEET_GK_DEF = 4;
    private static final int PTS_CLEAN_SHEET_MID    = 1;
    private static final int PTS_YELLOW_CARD    = -1;
    private static final int PTS_RED_CARD       = -3;
    private static final int PTS_SAVES_PER_3    =  1;

    private static final Map<String, String> ESPN_POSITION_MAP = Map.of(
            "Goalkeeper", "GK",
            "Defender",   "DEF",
            "Midfielder", "MID",
            "Forward",    "FWD",
            "Attacker",   "FWD"
    );

    private static final Pattern EVENT_ID_PATTERN = Pattern.compile("/events/(\\d+)");

    // 2026 World Cup Final is July 19 — stop polling the day after.
    private static final Instant TOURNAMENT_END = Instant.parse("2026-07-20T00:00:00Z");

    private final PlayerMatchStatsRepository repository;
    private final EspnApiClient espnApiClient;
    private final WorldCupDataProvider dataProvider;

    public PlayerPointsService(PlayerMatchStatsRepository repository,
                               EspnApiClient espnApiClient,
                               WorldCupDataProvider dataProvider) {
        this.repository   = repository;
        this.espnApiClient = espnApiClient;
        this.dataProvider  = dataProvider;
    }

    // ── Scheduled sync ────────────────────────────────────────────────────────

    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void syncCompletedMatchStats() {
        if (Instant.now().isAfter(TOURNAMENT_END)) {
            log.debug("Tournament ended — player stats sync disabled");
            return;
        }
        try {
            Map<String, String> positionByAthleteId = buildPositionLookup();
            if (positionByAthleteId.isEmpty()) {
                log.debug("No athletes found — skipping player stats sync");
                return;
            }

            JsonNode events = espnApiClient.fetchCoreEvents();
            for (JsonNode item : events.path("items")) {
                String ref     = item.path("$ref").asText("");
                String eventId = extractEventId(ref);
                if (eventId.isEmpty()) continue;
                if (repository.existsByEventId(eventId)) continue;

                processEvent(eventId, positionByAthleteId);
            }
        } catch (Exception e) {
            log.error("Player stats sync failed", e);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void processEvent(String eventId, Map<String, String> positionLookup) {
        try {
            JsonNode competition = espnApiClient.fetchCoreCompetition(eventId);

            // Skip future or in-progress matches — only process completed ones.
            // ESPN's date field is ISO-8601; we add 120 min to cover stoppage/ET.
            String dateText = competition.path("date").asText("");
            if (dateText.isEmpty()) return;
            Instant matchStart = OffsetDateTime.parse(dateText, ESPN_DATE_FORMATTER).toInstant();
            if (Instant.now().isBefore(matchStart.plus(120, ChronoUnit.MINUTES))) return;

            for (JsonNode competitor : competition.path("competitors")) {
                String teamId = competitor.path("id").asText("");
                if (teamId.isEmpty()) continue;
                processTeam(eventId, teamId, positionLookup);
            }
        } catch (Exception e) {
            log.debug("Skipping event {} — {}", eventId, e.getMessage());
        }
    }

    private void processTeam(String eventId, String teamId, Map<String, String> positionLookup) {
        JsonNode roster = espnApiClient.fetchCoreCompetitorRoster(eventId, teamId);
        for (JsonNode entry : roster.path("entries")) {
            String athleteId = String.valueOf(entry.path("playerId").asLong());
            if ("0".equals(athleteId)) continue;

            try {
                JsonNode statsRoot = espnApiClient.fetchCorePlayerStats(eventId, teamId, athleteId);
                Map<String, Integer> stats = flattenStats(statsRoot);

                int minutes = stats.getOrDefault("minutesPlayed", 0);
                if (minutes == 0) continue; // did not appear

                String position = positionLookup.getOrDefault(athleteId, "MID");

                PlayerMatchStats pms = new PlayerMatchStats();
                pms.setAthleteId(athleteId);
                pms.setEventId(eventId);
                pms.setPosition(position);
                pms.setMinutes(minutes);
                pms.setGoals(stats.getOrDefault("goals", 0));
                pms.setAssists(stats.getOrDefault("assists", 0));
                pms.setCleanSheet(stats.getOrDefault("cleanSheets", 0) > 0);
                pms.setYellowCards(stats.getOrDefault("yellowCards", 0));
                pms.setRedCards(stats.getOrDefault("redCards", 0));
                pms.setSaves(stats.getOrDefault("saves", 0));
                pms.setTotalPoints(calculatePoints(pms));

                repository.save(pms);
            } catch (Exception e) {
                log.debug("Skipping athlete {} in event {} — {}", athleteId, eventId, e.getMessage());
            }
        }
    }

    private int calculatePoints(PlayerMatchStats s) {
        int pts = 0;
        String pos = s.getPosition();

        // Appearance
        if (s.getMinutes() >= 60) pts += PTS_PLAYED_FULL;
        else if (s.getMinutes() > 0) pts += PTS_PLAYED_PARTIAL;

        // Goals
        int goalPts = switch (pos) {
            case "GK", "DEF" -> PTS_GOAL_GK_DEF;
            case "MID"       -> PTS_GOAL_MID;
            default          -> PTS_GOAL_FWD;
        };
        pts += s.getGoals() * goalPts;

        // Assists
        pts += s.getAssists() * PTS_ASSIST;

        // Clean sheet (60+ minutes required)
        if (s.isCleanSheet() && s.getMinutes() >= 60) {
            pts += switch (pos) {
                case "GK", "DEF" -> PTS_CLEAN_SHEET_GK_DEF;
                case "MID"       -> PTS_CLEAN_SHEET_MID;
                default          -> 0;
            };
        }

        // Cards
        pts += s.getYellowCards() * PTS_YELLOW_CARD;
        pts += s.getRedCards()    * PTS_RED_CARD;

        // GK saves (every 3 saves = 1 pt)
        if ("GK".equals(pos)) {
            pts += (s.getSaves() / 3) * PTS_SAVES_PER_3;
        }

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

    private String extractEventId(String ref) {
        Matcher m = EVENT_ID_PATTERN.matcher(ref);
        return m.find() ? m.group(1) : "";
    }
}
