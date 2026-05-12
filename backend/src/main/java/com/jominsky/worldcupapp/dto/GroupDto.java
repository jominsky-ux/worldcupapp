package com.jominsky.worldcupapp.dto;

import java.util.List;

/**
 * Represents one of the 12 World Cup groups (e.g. "Group A") and the
 * four teams assigned to it.
 *
 * @param id    Short identifier derived from the ESPN abbreviation (e.g. "A")
 * @param name  Full display name (e.g. "Group A")
 * @param teams The four member teams in draw order
 */
public record GroupDto(
        String id,
        String name,
        List<TeamDto> teams
) {}
