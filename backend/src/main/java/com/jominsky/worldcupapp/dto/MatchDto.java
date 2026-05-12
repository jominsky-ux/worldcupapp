package com.jominsky.worldcupapp.dto;

/**
 * A single match as it appears on the scoreboard — includes current score,
 * match state, and the group it belongs to.
 *
 * @param eventId      ESPN's unique identifier for this match; use it to fetch the full summary
 * @param homeTeam     Full name of the home side
 * @param homeTeamAbbr Three-letter abbreviation of the home side
 * @param awayTeam     Full name of the away side
 * @param awayTeamAbbr Three-letter abbreviation of the away side
 * @param homeScore    Current or final score for the home side (string to allow "–" before kickoff)
 * @param awayScore    Current or final score for the away side
 * @param status       ESPN state: "pre" (upcoming), "in" (live), or "post" (finished)
 * @param statusDetail Human-readable status label (e.g. "45'", "Final", "7:00 PM ET")
 * @param date         ISO-8601 UTC kick-off timestamp
 * @param groupName    Short group label (e.g. "Group A")
 */
public record MatchDto(
        String eventId,
        String homeTeam,
        String homeTeamAbbr,
        String awayTeam,
        String awayTeamAbbr,
        String homeScore,
        String awayScore,
        String status,
        String statusDetail,
        String date,
        String groupName
) {}
