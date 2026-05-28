package com.jominsky.worldcupapp.dto;

import java.util.UUID;

/**
 * Points breakdown for a single entry.
 *
 * @param entryId         Entry identifier
 * @param entryNumber     Entry number (1–3) within the user's entries
 * @param name            Display name of the entry
 * @param groupPoints     Points earned from correct group-stage 1st/2nd picks
 * @param thirdPlacePoints Points earned from correct 3rd-place picks
 * @param bracketPoints   Points earned from correct knockout-round picks
 * @param squadPoints     Fantasy player points accumulated by the squad
 * @param totalPoints     Sum of all categories
 */
public record EntryScoreDto(
        UUID entryId,
        int entryNumber,
        String name,
        int groupPoints,
        int thirdPlacePoints,
        int bracketPoints,
        int squadPoints,
        int totalPoints
) {}
