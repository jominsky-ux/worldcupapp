package com.jominsky.worldcupapp.dto;

/**
 * A single goal or scoring play within a match.
 *
 * @param type       Nature of the event as reported by ESPN (e.g. "Goal", "Own Goal", "Penalty")
 * @param minute     Match clock at time of the event (e.g. "37'", "90+2'")
 * @param scorerName Full display name of the goal scorer
 * @param assistName Full display name of the assisting player, or null if ESPN did not record one
 * @param teamName   Display name of the team that scored
 */
public record ScoringEventDto(
        String type,
        String minute,
        String scorerName,
        String assistName,
        String teamName
) {}
