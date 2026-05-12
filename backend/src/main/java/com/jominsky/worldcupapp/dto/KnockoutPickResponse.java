package com.jominsky.worldcupapp.dto;

import java.time.Instant;
import java.util.UUID;

public record KnockoutPickResponse(
        UUID id,
        String matchEventId,
        String winnerTeamId,
        Instant createdAt,
        Instant updatedAt) {
}
