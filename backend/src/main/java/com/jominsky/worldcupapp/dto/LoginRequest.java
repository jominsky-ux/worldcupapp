package com.jominsky.worldcupapp.dto;

public record LoginRequest(
        String email,
        String password) {
}
