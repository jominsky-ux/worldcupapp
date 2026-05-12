package com.jominsky.worldcupapp.dto;

import java.time.Instant;
import java.util.UUID;

public record EntryResponse(
        UUID id,
        int entryNumber,
        String name,
        Instant createdAt) {
}
