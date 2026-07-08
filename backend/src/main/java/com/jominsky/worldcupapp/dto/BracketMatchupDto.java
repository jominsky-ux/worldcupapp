package com.jominsky.worldcupapp.dto;

/**
 * One matchup in the knockout bracket, as served to the frontend.
 *
 * @param id                ESPN event ID (used as the matchupId when saving picks)
 * @param homeTeam          home competitor; null if ESPN has not yet announced the team
 * @param awayTeam          away competitor; null if ESPN has not yet announced the team
 * @param homeScore         goals scored by home team; null if match not yet completed
 * @param awayScore         goals scored by away team; null if match not yet completed
 * @param winnerId          ESPN team ID of the winning team; null if match not yet completed
 * @param homePenaltyScore  penalties scored by home team; null if match was not decided by penalties
 * @param awayPenaltyScore  penalties scored by away team; null if match was not decided by penalties
 */
public record BracketMatchupDto(
        String id,
        TeamDto homeTeam,
        TeamDto awayTeam,
        String homeScore,
        String awayScore,
        String winnerId,
        Integer homePenaltyScore,
        Integer awayPenaltyScore) {}
