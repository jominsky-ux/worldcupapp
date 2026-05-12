package com.jominsky.worldcupapp.dto;

import java.util.List;

/**
 * Detailed view of a single match, including the full list of scoring events.
 * Returned by GET /api/matches/{eventId}/summary.
 *
 * @param eventId       ESPN event identifier (same value used to request this summary)
 * @param homeTeam      Full name of the home side
 * @param awayTeam      Full name of the away side
 * @param homeScore     Final or current score for the home side
 * @param awayScore     Final or current score for the away side
 * @param status        Human-readable match status (e.g. "Final", "Halftime", "77'")
 * @param scoringEvents All goals in chronological order; empty list if no goals yet
 */
public record MatchSummaryDto(
        String eventId,
        String homeTeam,
        String awayTeam,
        String homeScore,
        String awayScore,
        String status,
        List<ScoringEventDto> scoringEvents
) {}
