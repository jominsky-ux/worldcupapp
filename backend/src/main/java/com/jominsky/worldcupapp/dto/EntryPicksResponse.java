package com.jominsky.worldcupapp.dto;

import java.util.List;
import java.util.UUID;

public record EntryPicksResponse(
        UUID entryId,
        int entryNumber,
        String name,
        String formation,
        List<GroupStagePickResponse> groupStagePicks,
        List<ThirdPlaceSelection> thirdPlacePicks,
        List<KnockoutPickResponse> knockoutPicks,
        List<SquadSlot> squadPicks) {
}
