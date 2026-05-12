package com.jominsky.worldcupapp.dto;

import java.util.List;

public record SquadPickRequest(String formation, List<SquadSlot> players) {
}
