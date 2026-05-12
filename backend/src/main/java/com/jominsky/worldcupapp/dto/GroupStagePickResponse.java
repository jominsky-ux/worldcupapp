package com.jominsky.worldcupapp.dto;

import java.time.Instant;
import java.util.UUID;

public record GroupStagePickResponse(
        UUID id,
        String groupId,
        String firstPlaceTeamId,
        String secondPlaceTeamId,
        Instant createdAt,
        Instant updatedAt) {
}
