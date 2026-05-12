package com.jominsky.worldcupapp.dto;

/**
 * Represents one of the 12 World Cup groups (e.g. "Group A") and the
 * four teams assigned to it.
 *
 * @param id       ESPN's unique iddentifier for this athlete
 * @param name     Full display name
 * @param position The athlete's position on the team (e.g. "Defender")
 * @param teamId   ESPN's unique identifier for the athlete's team; use it to
 */
public record AthleteDto(
        String id,
        String name,
        String position,
        TeamDto team) {
}
