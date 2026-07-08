package com.jominsky.worldcupapp.dto;

/**
 * A single knockout bracket pick: which team this entry predicted to win a match.
 * Shape matches the bracketPicks array already used by the frontend's buildPicksMap.
 *
 * @param matchupId    ESPN event ID of the knockout match
 * @param winnerTeamId ESPN team ID of the predicted winner
 */
public record BracketPickDto(String matchupId, String winnerTeamId) {}
