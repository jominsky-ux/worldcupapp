package com.jominsky.worldcupapp.dto;

public record GroupStagePickRequest(
        String groupId,
        String firstPlaceTeamId,
        String secondPlaceTeamId) {
}
