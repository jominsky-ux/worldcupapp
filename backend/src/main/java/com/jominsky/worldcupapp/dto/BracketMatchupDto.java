package com.jominsky.worldcupapp.dto;

/**
 * One matchup in the knockout bracket, as served to the frontend.
 *
 * @param id       ESPN event ID (used as the matchupId when saving picks)
 * @param homeTeam home competitor; null if ESPN has not yet announced the team
 * @param awayTeam away competitor; null if ESPN has not yet announced the team
 */
public record BracketMatchupDto(String id, TeamDto homeTeam, TeamDto awayTeam) {}
