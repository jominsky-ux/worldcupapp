package com.jominsky.worldcupapp.controller;

import com.jominsky.worldcupapp.dto.PlayerPointsDto;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerPointsController {

    private final WorldCupDataProvider dataProvider;

    public PlayerPointsController(WorldCupDataProvider dataProvider) {
        this.dataProvider = dataProvider;
    }

    @GetMapping("/points")
    public List<PlayerPointsDto> getAllPoints() {
        return dataProvider.getAllAthletePoints();
    }
}
