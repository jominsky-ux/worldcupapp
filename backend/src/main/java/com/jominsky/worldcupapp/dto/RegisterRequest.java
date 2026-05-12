package com.jominsky.worldcupapp.dto;

public record RegisterRequest(
        String email,
        String password,
        String displayName) {
}
