package com.jominsky.worldcupapp.dto;

/**
 * Represents a national team participating in the World Cup.
 *
 * @param id           ESPN's internal team identifier
 * @param name         Full display name (e.g. "United States")
 * @param abbreviation Three-letter code (e.g. "USA")
 * @param logoUrl      URL of the team's logo image hosted by ESPN
 */
public record TeamDto(
        String id,
        String name,
        String abbreviation,
        String logoUrl
) {}
