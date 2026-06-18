package com.jominsky.worldcupapp.dto;

import java.util.UUID;

/**
 * One row in the global leaderboard, representing a single entry.
 *
 * @param rank         Position in the leaderboard (1 = highest points)
 * @param displayName  User's display name
 * @param email        User's email (used by the frontend to highlight the current user's rows)
 * @param entryId      Entry identifier (used to fetch the per-entry score breakdown)
 * @param entryNumber  Entry number within the user's entries (1–3)
 * @param entryName    User-chosen name for this entry
 * @param totalPoints  Total fantasy points for this entry
 */
public record LeaderboardEntryDto(
        int rank,
        String displayName,
        String email,
        UUID entryId,
        int entryNumber,
        String entryName,
        int totalPoints
) {}
