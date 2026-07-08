package com.jominsky.worldcupapp.dto;

/**
 * Result for one 3rd-place pick within an entry.
 *
 * @param teamCode  Abbreviation of the picked team, e.g. "CRO"
 * @param groupName Display name of the group this team came from, e.g. "Group A"
 * @param correct   Whether this team actually finished 3rd in their group
 * @param points    Points earned (1 if correct, 0 otherwise; excludes all-8 bonus)
 */
public record ThirdPlacePickDetailDto(
        String teamCode,
        String groupName,
        boolean correct,
        int points
) {}
