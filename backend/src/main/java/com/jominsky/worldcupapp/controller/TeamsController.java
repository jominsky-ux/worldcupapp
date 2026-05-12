package com.jominsky.worldcupapp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jominsky.worldcupapp.dto.AthleteDto;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;

/**
 * REST controller that exposes World Cup team data.
 *
 * Consumed by the React frontend's {@code useAthletes()} hook, which populates
 * the squad-selection options on SquadPage.
 */
@RestController
@RequestMapping("/api/teams")
public class TeamsController {

    private final WorldCupDataProvider dataProvider;

    /**
     * @param dataProvider injected provider implementation (ESPN by default)
     */
    public TeamsController(WorldCupDataProvider dataProvider) {
        this.dataProvider = dataProvider;
    }

    /**
     * Returns all 48 teams' player data.
     *
     * @return 200 with the athletes list; empty list body if the provider fails
     */
    @GetMapping("/athletes")
    public ResponseEntity<List<AthleteDto>> getAllTeamAthletes() {
        return ResponseEntity.ok(dataProvider.getAllTeamAthletes());
    }
}
