package com.jominsky.worldcupapp.dto;

import java.util.List;

public record AllPicksResponse(
        List<GroupStagePickResponse> groupStagePicks,
        List<String> thirdPlaceTeamIds,
        List<KnockoutPickResponse> knockoutPicks) {
}
