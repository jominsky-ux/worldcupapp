package com.jominsky.worldcupapp.dto;

import java.util.UUID;

public record AuthResponse(
        String token,
        UUID userId,
        String email,
        String displayName,
        String role) {
}
