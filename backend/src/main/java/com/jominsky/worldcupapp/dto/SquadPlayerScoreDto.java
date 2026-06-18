package com.jominsky.worldcupapp.dto;

/**
 * One player in an entry's squad, with their fantasy points to date.
 *
 * @param athleteId   ESPN athlete identifier
 * @param name        Player's full display name
 * @param position    GK, DEF, MID, or FWD
 * @param totalPoints Fantasy points earned across all completed matches
 */
public record SquadPlayerScoreDto(
        String athleteId,
        String name,
        String position,
        int totalPoints
) {}
