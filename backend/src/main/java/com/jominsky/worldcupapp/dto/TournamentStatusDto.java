package com.jominsky.worldcupapp.dto;

/**
 * High-level status of the tournament, consumed by the React frontend to decide
 * which pick pages are open and whether to show a live-match indicator.
 *
 * @param phase                   Current stage: "group", "round-of-32",
 *                                "round-of-16",
 *                                "quarter", "semi", "final", or "unknown"
 * @param hasLiveMatches          True if at least one match is currently in
 *                                progress
 * @param nextMatchDate           ISO-8601 UTC timestamp of the next scheduled
 *                                kick-off,
 *                                or null if no upcoming matches are visible in
 *                                the
 *                                ESPN window
 * @param totalMatches            Total number of matches visible in the current
 *                                ESPN
 *                                window
 * @param completedMatches        Number of those matches that have finished
 * @param groupPicksOpen          True if the group stage has not yet started
 *                                (group
 *                                and squad picks accepted)
 * @param groupStageFirstGameTime ISO-8601 UTC timestamp of the first scheduled
 * @param bracketPicksOpen        True if the round of 32 has not yet started
 *                                (knockout
 *                                picks accepted)
 * @param roundOf32FirstGameTime  ISO-8601 UTC timestamp of the first scheduled
 */
public record TournamentStatusDto(
                String phase,
                boolean hasLiveMatches,
                String nextMatchDate,
                int totalMatches,
                int completedMatches,
                boolean groupPicksOpen,
                String groupStageFirstGameTime,
                boolean bracketPicksOpen,
                String roundOf32FirstGameTime) {
}
