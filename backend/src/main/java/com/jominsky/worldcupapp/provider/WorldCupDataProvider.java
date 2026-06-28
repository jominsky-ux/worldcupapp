package com.jominsky.worldcupapp.provider;

import com.jominsky.worldcupapp.dto.AthleteDto;
import com.jominsky.worldcupapp.dto.BracketMatchupDto;
import com.jominsky.worldcupapp.dto.GroupDto;
import com.jominsky.worldcupapp.dto.MatchSummaryDto;
import com.jominsky.worldcupapp.dto.PlayerMatchGameStatsDto;
import com.jominsky.worldcupapp.dto.PlayerPointsDto;
import com.jominsky.worldcupapp.dto.ScoreboardDto;
import com.jominsky.worldcupapp.dto.StandingsGroupDto;
import com.jominsky.worldcupapp.dto.TournamentStatusDto;

import java.util.List;
import java.util.Map;

/**
 * Abstraction layer for retrieving World Cup data from an external source.
 *
 * Controllers and services depend only on this interface; the underlying data
 * source (ESPN, a different sports API, or a test stub) is determined by which
 * Spring bean is marked {@code @Primary} or selected via a Spring profile.
 *
 * Current implementations:
 * <ul>
 * <li>{@code EspnWorldCupDataProvider} – default, uses ESPN's unofficial public
 * API</li>
 * </ul>
 *
 * To add a new provider, implement this interface and annotate the class with
 * {@code @Service} and {@code @Primary} (removing {@code @Primary} from
 * {@code EspnWorldCupDataProvider}), or use {@code @Profile} to select at
 * startup.
 */
public interface WorldCupDataProvider {

    /**
     * Returns all World Cup groups, each containing their member teams.
     * The 2026 tournament has 12 groups of 4 teams each (48 teams total).
     *
     * @return list of groups in draw order; empty list on provider failure
     */
    List<GroupDto> getGroups();

    /**
     * Returns all athletes for every team
     *
     * @return one StandingsGroupDto per group; empty list on provider failure
     */
    List<AthleteDto> getAllTeamAthletes();

    /**
     * Returns the current standings table for every group, with teams
     * sorted by their current position (most points first).
     *
     * @return one StandingsGroupDto per group; empty list on provider failure
     */
    List<StandingsGroupDto> getStandings();

    /**
     * Returns the scoreboard showing recent, live, and upcoming matches.
     * The time window depends on the underlying provider (ESPN defaults to
     * the current calendar week).
     *
     * @return scoreboard DTO containing a list of matches; never null
     */
    ScoreboardDto getScoreboard();

    /**
     * Returns detailed goal and assist information for a specific match.
     *
     * @param eventId the provider-specific match identifier (for ESPN: the numeric
     *                event ID
     *                found in the scoreboard response)
     * @return match summary with scoring events, or {@code null} if not found
     */
    MatchSummaryDto getMatchSummary(String eventId);

    /**
     * Returns a snapshot of the current tournament phase and live-match status,
     * used by the frontend to gate pick submissions and show live indicators.
     *
     * @return tournament status; never null (returns "unknown" phase on failure)
     */
    TournamentStatusDto getTournamentStatus();

    /**
     * Returns the Round of 32 matchups with real competitor team data from ESPN,
     * in bracket-visual order (top-to-bottom). Used by the frontend bracket picker
     * instead of the hardcoded mock team assignments.
     *
     * @return list of 16 matchups; may be shorter if ESPN has not announced all teams yet
     */
    List<BracketMatchupDto> getBracketMatchups();

    /**
     * Returns a map of ESPN event ID → winning team ID for every completed match
     * in the season. Used by the scoring service to validate bracket picks.
     *
     * @return map of eventId → winnerId; empty map on provider failure
     */
    Map<String, String> getCompletedMatchWinners();

    /**
     * Returns aggregated fantasy points for every athlete who has appeared in
     * at least one completed match.
     *
     * @return list of (athleteId, totalPoints) pairs; empty list if no data yet
     */
    List<PlayerPointsDto> getAllAthletePoints();

    /**
     * Returns per-game fantasy stats for one athlete across every completed
     * match they appeared in, most recent first, with opponent context resolved.
     *
     * @param athleteId the provider-specific athlete identifier
     * @return list of per-game stats; empty list if the athlete has no recorded matches
     */
    List<PlayerMatchGameStatsDto> getAthleteMatchHistory(String athleteId);
}
