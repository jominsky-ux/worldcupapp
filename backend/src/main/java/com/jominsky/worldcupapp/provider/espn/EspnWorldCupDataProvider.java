package com.jominsky.worldcupapp.provider.espn;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.jominsky.worldcupapp.dto.AthleteDto;
import com.jominsky.worldcupapp.dto.BracketMatchupDto;
import com.jominsky.worldcupapp.dto.GroupDto;
import com.jominsky.worldcupapp.dto.MatchDto;
import com.jominsky.worldcupapp.dto.MatchSummaryDto;
import com.jominsky.worldcupapp.dto.PlayerMatchGameStatsDto;
import com.jominsky.worldcupapp.dto.PlayerPointsDto;
import com.jominsky.worldcupapp.dto.ScoreboardDto;
import com.jominsky.worldcupapp.dto.ScoringEventDto;
import com.jominsky.worldcupapp.dto.StandingsGroupDto;
import com.jominsky.worldcupapp.dto.TeamDto;
import com.jominsky.worldcupapp.dto.TeamStandingDto;
import com.jominsky.worldcupapp.dto.TournamentStatusDto;
import com.jominsky.worldcupapp.model.PlayerMatchStats;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import com.jominsky.worldcupapp.repository.PlayerMatchStatsRepository;

/**
 * Default implementation of {@link WorldCupDataProvider} backed by ESPN's
 * unofficial public soccer API.
 *
 * This class is responsible only for transforming ESPN's raw JSON trees
 * (fetched and cached by {@link EspnApiClient}) into the application's
 * domain DTOs. No HTTP logic lives here.
 *
 * ESPN's standings response organises data under a {@code children} array
 * where each element represents one group. The scoreboard response has an
 * {@code events} array where each element is one match. The summary endpoint
 * exposes a {@code scoringPlays} array for goals and assists.
 *
 * Marked {@code @Primary} so Spring autowires this implementation by default.
 * Remove {@code @Primary} and annotate an alternative with it (or use
 * {@code @Profile}) to swap providers without touching controllers.
 */
@Service
@Primary
public class EspnWorldCupDataProvider implements WorldCupDataProvider {

    private static final Logger log = LoggerFactory.getLogger(EspnWorldCupDataProvider.class);

    private final EspnApiClient espnApiClient;
    private final PlayerMatchStatsRepository statsRepository;

    private static final String GROUP_STAGE_FIRST_GAME_TIME = "2026-06-11T20:00:00Z";
    private static final String GROUP_STAGE_END_TIME = "2026-06-28T02:30:00Z";
    private static final String ROUND_OF_32_FIRST_GAME_TIME = "2026-06-28T19:00:00Z";

    public EspnWorldCupDataProvider(EspnApiClient espnApiClient,
                                    PlayerMatchStatsRepository statsRepository) {
        this.espnApiClient = espnApiClient;
        this.statsRepository = statsRepository;
    }

    /**
     * Derives group membership from the standings endpoint.
     * ESPN's standings response includes team identity inside each group's entries,
     * so a separate "teams" call is unnecessary.
     *
     * @return list of groups with their member teams; empty list if ESPN is
     *         unreachable
     */
    @Override
    public List<GroupDto> getGroups() {
        try {
            JsonNode root = espnApiClient.fetchStandings();
            List<GroupDto> groups = new ArrayList<>();

            for (JsonNode child : root.path("children")) {
                String groupName = child.path("name").asText("Unknown Group");
                String groupId = child.path("id").asText("99");

                List<TeamDto> teams = new ArrayList<>();
                for (JsonNode entry : child.path("standings").path("entries")) {
                    teams.add(mapTeam(entry.path("team")));
                }

                groups.add(new GroupDto(groupId, groupName, teams));
            }
            return groups;

        } catch (Exception e) {
            log.error("Failed to fetch groups from ESPN", e);
            return Collections.emptyList();
        }
    }

    /**
     * Parses current standings from ESPN's standings response.
     *
     * ESPN stores statistics as an array of {@code {name, value}} objects per team
     * entry. {@link #parseStats(JsonNode)} converts that array into a name→int map
     * for readable access.
     *
     * Stat names used from ESPN's soccer standings:
     * <ul>
     * <li>{@code gamesPlayed} – matches played</li>
     * <li>{@code wins}, {@code ties}, {@code losses} – result counts</li>
     * <li>{@code pointsFor} – goals scored</li>
     * <li>{@code pointsAgainst} – goals conceded</li>
     * <li>{@code points} – tournament points (3/win, 1/draw)</li>
     * </ul>
     *
     * @return standings for all groups; empty list if ESPN is unreachable
     */
    @Override
    public List<StandingsGroupDto> getStandings() {
        try {
            JsonNode root = espnApiClient.fetchStandings();
            List<StandingsGroupDto> standings = new ArrayList<>();

            for (JsonNode child : root.path("children")) {
                String groupName = child.path("name").asText("Unknown Group");
                List<TeamStandingDto> teamStandings = new ArrayList<>();

                for (JsonNode entry : child.path("standings").path("entries")) {
                    TeamDto team = mapTeam(entry.path("team"));
                    Map<String, Integer> stats = parseStats(entry.path("stats"));

                    int gf = stats.getOrDefault("pointsFor", 0);
                    int ga = stats.getOrDefault("pointsAgainst", 0);

                    // position is reassigned below once teams are ranked; 0 is a placeholder.
                    teamStandings.add(new TeamStandingDto(
                            0,
                            team,
                            stats.getOrDefault("gamesPlayed", 0),
                            stats.getOrDefault("wins", 0),
                            stats.getOrDefault("ties", 0),
                            stats.getOrDefault("losses", 0),
                            gf,
                            ga,
                            gf - ga,
                            stats.getOrDefault("points", 0)));
                }

                // ESPN's "entries" array is not guaranteed to be rank-ordered, so the
                // group table is ranked here by points, then goal difference, then
                // goals scored (standard tournament tiebreakers).
                teamStandings.sort(
                        Comparator.comparingInt(TeamStandingDto::points).reversed()
                                .thenComparing(Comparator.comparingInt(TeamStandingDto::goalDifference).reversed())
                                .thenComparing(Comparator.comparingInt(TeamStandingDto::goalsFor).reversed()));

                List<TeamStandingDto> ranked = new ArrayList<>(teamStandings.size());
                int position = 1;
                for (TeamStandingDto ts : teamStandings) {
                    ranked.add(new TeamStandingDto(position++, ts.team(), ts.played(), ts.wins(),
                            ts.draws(), ts.losses(), ts.goalsFor(), ts.goalsAgainst(),
                            ts.goalDifference(), ts.points()));
                }
                standings.add(new StandingsGroupDto(groupName, ranked));
            }
            return standings;

        } catch (Exception e) {
            log.error("Failed to fetch standings from ESPN", e);
            return Collections.emptyList();
        }
    }

    /**
     * Maps each event in the ESPN scoreboard response to a {@link MatchDto}.
     *
     * ESPN places competitor data in {@code competitions[0].competitors}, with
     * each competitor flagged as "home" or "away" via the {@code homeAway} field.
     *
     * @return scoreboard with all visible matches; returns an empty scoreboard on
     *         failure
     */
    @Override
    public ScoreboardDto getScoreboard() {
        try {
            JsonNode root = espnApiClient.fetchScoreboard();
            List<MatchDto> matches = new ArrayList<>();

            for (JsonNode event : root.path("events")) {
                matches.add(mapMatch(event));
            }
            return new ScoreboardDto(matches);

        } catch (Exception e) {
            log.error("Failed to fetch scoreboard from ESPN", e);
            return new ScoreboardDto(Collections.emptyList());
        }
    }

    /**
     * Parses scoring plays from the ESPN match summary endpoint.
     *
     * ESPN represents athletes involved in a play as an ordered array under
     * {@code athletesInvolved}: index 0 is the goal scorer, index 1 (if present)
     * is the assist. Assists are not guaranteed — ESPN's data feed may omit them
     * even when one occurred.
     *
     * @param eventId ESPN event identifier
     * @return detailed match summary; {@code null} if the event is not found
     */
    @Override
    public MatchSummaryDto getMatchSummary(String eventId) {
        try {
            JsonNode root = espnApiClient.fetchMatchSummary(eventId);

            JsonNode competition = root.path("header").path("competitions").path(0);
            JsonNode competitors = competition.path("competitors");
            JsonNode home = findCompetitor(competitors, "home");
            JsonNode away = findCompetitor(competitors, "away");

            List<ScoringEventDto> events = new ArrayList<>();
            for (JsonNode play : root.path("scoringPlays")) {
                events.add(mapScoringEvent(play));
            }

            return new MatchSummaryDto(
                    eventId,
                    home.path("team").path("displayName").asText(""),
                    away.path("team").path("displayName").asText(""),
                    home.path("score").asText("0"),
                    away.path("score").asText("0"),
                    competition.path("status").path("type").path("description").asText(""),
                    events);

        } catch (Exception e) {
            log.error("Failed to fetch match summary for event {} from ESPN", eventId, e);
            return null;
        }
    }

    /**
     * Derives tournament status from the current scoreboard window.
     *
     * Scans all visible events to determine whether any match is live,
     * find the next scheduled kick-off, and count completed vs total matches.
     * Phase is inferred from the ESPN season type field — falls back to "group"
     * when the season type is absent or unrecognised.
     *
     * @return tournament status snapshot; never null
     */
    @Override
    public TournamentStatusDto getTournamentStatus() {
        Instant now = Instant.now();
        boolean groupPicksOpen = now.isBefore(Instant.parse(GROUP_STAGE_FIRST_GAME_TIME));
        boolean bracketPicksOpen = now.isBefore(Instant.parse(ROUND_OF_32_FIRST_GAME_TIME))
                && now.isAfter(Instant.parse(GROUP_STAGE_END_TIME));

        try {
            JsonNode root = espnApiClient.fetchSeason();

            boolean hasLive = false;
            String nextMatchDate = null;
            int total = 0;
            int completed = 0;
            String groupStageDeadline = GROUP_STAGE_FIRST_GAME_TIME;
            String roundOf32Deadline = ROUND_OF_32_FIRST_GAME_TIME;
            String phase = derivePhase(root);

            return new TournamentStatusDto(
                    phase,
                    hasLive,
                    nextMatchDate,
                    total,
                    completed,
                    groupPicksOpen,
                    groupStageDeadline,
                    bracketPicksOpen,
                    roundOf32Deadline);

        } catch (Exception e) {
            log.error("Failed to fetch tournament status from ESPN", e);
            return new TournamentStatusDto("unknown", false, null, 0, 0, groupPicksOpen, null, bracketPicksOpen, null);
        }
    }

    // -------------------------------------------------------------------------
    // Private mapping helpers
    // -------------------------------------------------------------------------

    // All 31 knockout event IDs in bracket-position order (top-to-bottom visual layout
    // within each round). Must stay in sync with ROUND_MATCHUP_IDS in the frontend's bracket.js.
    private static final List<String> ALL_KNOCKOUT_EVENT_IDS = List.of(
        // R32 (16 matches)
        "760489", "760492", "760486", "760488",  // GER/PAR, FRA/SWE, RSA/CAN, NED/MAR
        "760497", "760496", "760494", "760493",  // POR/CRO, ESP/AUT, USA/BIH, BEL/SEN
        "760487", "760490", "760491", "760495",  // BRA/JPN, CIV/NOR, MEX/ECU, ENG/COD
        "760500", "760499", "760498", "760501",  // ARG/CPV, AUS/EGY, SUI/ALG, COL/GHA
        // R16 (8 matches)
        "760503", "760502", "760506", "760507",  // GER/FRA half, RSA/NED half, POR/ESP half, USA/BEL half
        "760504", "760505", "760508", "760509",  // BRA/CIV half, MEX/ENG half, ARG/AUS half, SUI/COL half
        // QF (4 matches)
        "760510", "760512", "760511", "760513",
        // SF (2 matches)
        "760514", "760515",
        // Final (1 match — 760516 is 3rd place, excluded)
        "760517"
    );

    /**
     * Returns all 31 knockout matchups (R32 through Final) with real competitor
     * team data and live results from ESPN's full-season events feed. Matchups are
     * returned in the same bracket-position order as {@code ALL_KNOCKOUT_EVENT_IDS}.
     *
     * Teams are null for any matchup whose participants have not yet been determined
     * (e.g., a QF slot before the R16 result is known).
     *
     * @return list of all knockout matchups; empty list if ESPN is unreachable
     */
    @Override
    public List<BracketMatchupDto> getBracketMatchups() {
        try {
            JsonNode root = espnApiClient.fetchCoreEvents();

            // Index all events by ID for O(1) lookup
            Map<String, JsonNode> eventsById = new LinkedHashMap<>();
            for (JsonNode event : root.path("events")) {
                eventsById.put(event.path("id").asText(), event);
            }

            List<BracketMatchupDto> matchups = new ArrayList<>();
            for (String eventId : ALL_KNOCKOUT_EVENT_IDS) {
                JsonNode event = eventsById.get(eventId);
                if (event == null) continue;

                JsonNode competition = event.path("competitions").path(0);
                JsonNode competitors = competition.path("competitors");
                JsonNode homeNode = findCompetitor(competitors, "home");
                JsonNode awayNode = findCompetitor(competitors, "away");

                TeamDto home = resolveTeam(homeNode);
                TeamDto away = resolveTeam(awayNode);

                JsonNode statusType = competition.path("status").path("type");
                boolean completed = statusType.path("completed").asBoolean(false);
                boolean wasPenalty = "STATUS_FINAL_PEN".equals(statusType.path("name").asText());
                String homeScore = null;
                String awayScore = null;
                String winnerId = null;
                Integer homePenaltyScore = null;
                Integer awayPenaltyScore = null;
                if (completed && !homeNode.isMissingNode() && !awayNode.isMissingNode()) {
                    homeScore = homeNode.path("score").asText(null);
                    awayScore = awayNode.path("score").asText(null);
                    if (homeNode.path("winner").asBoolean(false)) {
                        winnerId = homeNode.path("team").path("id").asText(null);
                    } else if (awayNode.path("winner").asBoolean(false)) {
                        winnerId = awayNode.path("team").path("id").asText(null);
                    }
                    if (wasPenalty && !homeNode.path("shootoutScore").isMissingNode()) {
                        homePenaltyScore = homeNode.path("shootoutScore").asInt();
                        awayPenaltyScore = awayNode.path("shootoutScore").asInt();
                    }
                }

                matchups.add(new BracketMatchupDto(eventId, home, away, homeScore, awayScore, winnerId, homePenaltyScore, awayPenaltyScore));
            }
            return matchups;

        } catch (Exception e) {
            log.error("Failed to fetch bracket matchups from ESPN", e);
            return Collections.emptyList();
        }
    }

    /**
     * Returns a map of ESPN event ID → winning team ID for every completed match
     * in the full-season events feed. The scoring service uses this to validate
     * bracket picks against actual results.
     *
     * @return map of eventId → winnerId; empty map if ESPN is unreachable
     */
    @Override
    public Map<String, String> getCompletedMatchWinners() {
        try {
            JsonNode root = espnApiClient.fetchCoreEvents();
            Map<String, String> winners = new HashMap<>();
            for (JsonNode event : root.path("events")) {
                String eventId = event.path("id").asText();
                JsonNode competition = event.path("competitions").path(0);
                boolean completed = competition.path("status").path("type").path("completed").asBoolean(false);
                if (!completed) continue;
                for (JsonNode competitor : competition.path("competitors")) {
                    if (competitor.path("winner").asBoolean(false)) {
                        winners.put(eventId, competitor.path("team").path("id").asText());
                        break;
                    }
                }
            }
            return winners;
        } catch (Exception e) {
            log.error("Failed to fetch completed match winners from ESPN", e);
            return Collections.emptyMap();
        }
    }

    /**
     * Returns all athletes for every team
     *
     * @return list of athletes; empty list if ESPN is unreachable
     */
    @Override
    public List<AthleteDto> getAllTeamAthletes() {
        List<GroupDto> groups = getGroups();
        List<AthleteDto> athletes = new ArrayList<>();

        for (GroupDto group : groups) {
            for (TeamDto team : group.teams()) {
                try {
                    espnApiClient.fetchTeamAthletes(team).path("athletes").forEach(athleteNode -> {
                        athletes.add(new AthleteDto(
                                athleteNode.path("id").asText(""),
                                athleteNode.path("displayName").asText(""),
                                athleteNode.path("position").path("displayName").asText(""),
                                team));
                    });
                } catch (Exception e) {
                    log.warn("Could not fetch roster for team {} ({}) — skipping: {}",
                            team.id(), team.name(), e.getMessage());
                }
            }
        }

        return athletes;
    }

    @Override
    public List<PlayerPointsDto> getAllAthletePoints() {
        List<Object[]> rows = statsRepository.sumPointsByAthlete();
        List<PlayerPointsDto> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            result.add(new PlayerPointsDto((String) row[0], ((Number) row[1]).intValue()));
        }
        return result;
    }

    /**
     * Returns per-game fantasy stats for one athlete, resolving each match's
     * opponent team name/abbreviation from the current group data.
     *
     * @param athleteId the ESPN athlete identifier
     * @return per-game stats, most recent first; empty list if none recorded
     */
    @Override
    public List<PlayerMatchGameStatsDto> getAthleteMatchHistory(String athleteId) {
        List<PlayerMatchStats> rows = statsRepository.findByAthleteIdOrderByMatchDateDesc(athleteId);
        if (rows.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, TeamDto> teamsById = new HashMap<>();
        for (GroupDto group : getGroups()) {
            for (TeamDto team : group.teams()) {
                teamsById.put(team.id(), team);
            }
        }

        List<PlayerMatchGameStatsDto> result = new ArrayList<>(rows.size());
        for (PlayerMatchStats s : rows) {
            TeamDto opponent = teamsById.get(s.getOpponentTeamId());
            result.add(new PlayerMatchGameStatsDto(
                    s.getEventId(),
                    opponent != null ? opponent.name() : "",
                    opponent != null ? opponent.abbreviation() : "",
                    s.getMatchDate(),
                    s.getTotalPoints(),
                    s.getMinutes(),
                    s.getGoals(),
                    s.getAssists(),
                    s.getDefensiveInterventions(),
                    s.isCleanSheet(),
                    s.getSaves(),
                    s.getOwnGoals(),
                    s.getYellowCards(),
                    s.getRedCards(),
                    s.getPenaltyMisses(),
                    s.getPenaltySaves()));
        }
        return result;
    }

    /**
     * Maps an ESPN team JSON node to a {@link TeamDto}.
     * Uses the first logo URL when multiple sizes are provided.
     *
     * @param teamNode ESPN {@code team} sub-object
     * @return populated TeamDto; fields default to empty strings on missing data
     */
    private TeamDto resolveTeam(JsonNode competitorNode) {
        if (competitorNode.isMissingNode()) return null;
        JsonNode teamNode = competitorNode.path("team");
        if (teamNode.path("id").asText("").isEmpty()) return null;
        return mapTeam(teamNode);
    }

    private TeamDto mapTeam(JsonNode teamNode) {
        String logoUrl = "";
        // Standings endpoint: logos is an array of {href, width, height, ...}
        JsonNode logos = teamNode.path("logos");
        if (logos.isArray() && !logos.isEmpty()) {
            logoUrl = logos.path(0).path("href").asText("");
        } else {
            // Scoreboard/events endpoint: logo is a plain string
            logoUrl = teamNode.path("logo").asText("");
        }
        return new TeamDto(
                teamNode.path("id").asText(""),
                teamNode.path("displayName").asText(""),
                teamNode.path("abbreviation").asText(""),
                logoUrl);
    }

    /**
     * Maps an ESPN scoreboard event node to a {@link MatchDto}.
     *
     * @param event ESPN {@code event} element from the {@code events} array
     * @return populated MatchDto
     */
    private MatchDto mapMatch(JsonNode event) {
        JsonNode statusType = event.path("status").path("type");
        JsonNode competition = event.path("competitions").path(0);
        JsonNode competitors = competition.path("competitors");
        JsonNode home = findCompetitor(competitors, "home");
        JsonNode away = findCompetitor(competitors, "away");

        return new MatchDto(
                event.path("id").asText(""),
                home.path("team").path("displayName").asText(""),
                home.path("team").path("abbreviation").asText(""),
                away.path("team").path("displayName").asText(""),
                away.path("team").path("abbreviation").asText(""),
                home.path("score").asText("–"),
                away.path("score").asText("–"),
                statusType.path("state").asText("pre"),
                statusType.path("description").asText(""),
                event.path("date").asText(""),
                competition.path("groups").path("shortName").asText(""));
    }

    /**
     * Maps an ESPN scoring play node to a {@link ScoringEventDto}.
     *
     * ESPN's {@code athletesInvolved} array is ordered: scorer first, assister
     * second.
     * The assister element is absent if ESPN's data feed did not record an assist.
     *
     * @param play ESPN {@code scoringPlays} element
     * @return populated ScoringEventDto; assistName is null when not recorded
     */
    private ScoringEventDto mapScoringEvent(JsonNode play) {
        JsonNode athletes = play.path("athletesInvolved");
        String scorer = athletes.size() > 0 ? athletes.path(0).path("displayName").asText("") : "";
        String assist = athletes.size() > 1 ? athletes.path(1).path("displayName").asText(null) : null;

        return new ScoringEventDto(
                play.path("type").path("text").asText("Goal"),
                play.path("clock").path("displayValue").asText(""),
                scorer,
                assist,
                play.path("team").path("displayName").asText(""));
    }

    /**
     * Locates a competitor node by its {@code homeAway} value.
     * Falls back to the first competitor if no match is found, which prevents
     * a NullPointerException in the unlikely event ESPN omits the field.
     *
     * @param competitors ESPN {@code competitors} array
     * @param homeAway    "home" or "away"
     * @return matching competitor node, or the first node as a fallback
     */
    private JsonNode findCompetitor(JsonNode competitors, String homeAway) {
        for (JsonNode competitor : competitors) {
            if (homeAway.equals(competitor.path("homeAway").asText())) {
                return competitor;
            }
        }
        return competitors.path(0);
    }

    /**
     * Converts ESPN's stats array format into a name→int map for readable access.
     *
     * ESPN stores statistics as {@code [ {"name": "wins", "value": 2.0}, ... ]}.
     * Values are floats in the raw JSON; they are truncated to int here because
     * all soccer statistics (goals, points, matches) are whole numbers.
     *
     * @param statsNode ESPN {@code stats} array node
     * @return map of stat name to integer value
     */
    private Map<String, Integer> parseStats(JsonNode statsNode) {
        Map<String, Integer> stats = new HashMap<>();
        for (JsonNode stat : statsNode) {
            stats.put(stat.path("name").asText(), stat.path("value").asInt(0));
        }
        return stats;
    }

    /**
     * Infers the tournament phase from ESPN's season type field.
     *
     * ESPN uses numeric season types to distinguish tournament stages.
     * Type "3" typically indicates a playoff/knockout phase.
     * Falls back to "group" for unrecognised or missing values.
     *
     * @param seasonRoot root node of the ESPN seasons API response
     * @return phase string: "group", "round-of-32", "round-of-16", "quarter",
     *         "semi", "final", or "unknown"
     */
    private String derivePhase(JsonNode seasonRoot) {
        String name = seasonRoot.path("type").path("name").asText("").toLowerCase();
        if (name.contains("group"))
            return "group";
        if (name.contains("32"))
            return "round-of-32";
        if (name.contains("16"))
            return "round-of-16";
        if (name.contains("quarter"))
            return "quarter";
        if (name.contains("semi"))
            return "semi";
        if (name.contains("final"))
            return "final";
        return "unknown";
    }
}
