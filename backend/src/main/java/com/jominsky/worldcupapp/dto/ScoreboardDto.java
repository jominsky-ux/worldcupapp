package com.jominsky.worldcupapp.dto;

import java.util.List;

/**
 * The full scoreboard returned by GET /api/matches.
 * Contains all matches visible in the current ESPN scoreboard window
 * (scheduled, live, and recently completed).
 *
 * @param matches Ordered list of matches as returned by ESPN
 */
public record ScoreboardDto(
        List<MatchDto> matches
) {}
