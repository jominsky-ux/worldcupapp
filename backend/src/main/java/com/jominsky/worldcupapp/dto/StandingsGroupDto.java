package com.jominsky.worldcupapp.dto;

import java.util.List;

/**
 * The standings table for a single group, with teams listed in current rank order.
 *
 * @param groupName Display name of the group (e.g. "Group A")
 * @param teams     Teams sorted by position (1st through 4th)
 */
public record StandingsGroupDto(
        String groupName,
        List<TeamStandingDto> teams
) {}
