package com.jominsky.worldcupapp.dto;

import java.util.List;
import java.util.UUID;

/**
 * Full points breakdown for a single entry, including its squad roster and pick details.
 * Used by the leaderboard's per-entry detail modal — publicly accessible
 * since the leaderboard itself is public.
 *
 * @param entryId               Entry identifier
 * @param entryNumber           Entry number (1-3) within the owning user's entries
 * @param name                  Display name of the entry
 * @param groupPoints           Points earned from correct group-stage 1st/2nd picks
 * @param thirdPlacePoints      Points earned from correct 3rd-place picks
 * @param bracketPoints         Points earned from correct knockout-round picks
 * @param squadPoints           Fantasy player points accumulated by the squad
 * @param totalPoints           Sum of all categories
 * @param squad                 Squad players ordered by position (GK, DEF, MID, FWD)
 * @param groupPickDetails      Per-group pick breakdown; sorted by group name
 * @param thirdPlacePickDetails Per-team 3rd-place pick results; sorted by group name
 * @param bracketPicks          All knockout picks as {matchupId, winnerTeamId} pairs
 */
public record EntryDetailDto(
        UUID entryId,
        int entryNumber,
        String name,
        int groupPoints,
        int thirdPlacePoints,
        int bracketPoints,
        int squadPoints,
        int totalPoints,
        List<SquadPlayerScoreDto> squad,
        List<GroupPickDetailDto> groupPickDetails,
        List<ThirdPlacePickDetailDto> thirdPlacePickDetails,
        List<BracketPickDto> bracketPicks
) {}
