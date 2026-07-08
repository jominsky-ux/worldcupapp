package com.jominsky.worldcupapp.dto;

/**
 * Points breakdown for one group's stage picks within an entry.
 *
 * @param groupId         ESPN group identifier
 * @param groupName       Display name, e.g. "Group A"
 * @param firstPickCode   Abbreviation of the team the entry picked 1st
 * @param secondPickCode  Abbreviation of the team the entry picked 2nd
 * @param actualFirstCode Abbreviation of the actual 1st-place team; null before group stage completes
 * @param actualSecondCode Abbreviation of the actual 2nd-place team; null before group stage completes
 * @param firstCorrect    Whether the 1st-place pick matched the actual result
 * @param secondCorrect   Whether the 2nd-place pick matched the actual result
 * @param points          Points earned for this group (excluding any all-groups bonus)
 */
public record GroupPickDetailDto(
        String groupId,
        String groupName,
        String firstPickCode,
        String secondPickCode,
        String actualFirstCode,
        String actualSecondCode,
        boolean firstCorrect,
        boolean secondCorrect,
        int points
) {}
