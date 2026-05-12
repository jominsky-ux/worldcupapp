package com.jominsky.worldcupapp.dto;

public record KnockoutPickRequest(
        String matchEventId,
        String winnerTeamId) {
}
