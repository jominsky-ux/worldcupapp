package com.jominsky.worldcupapp.controller;

import com.jominsky.worldcupapp.dto.StandingsGroupDto;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller that exposes live group-stage standings.
 *
 * Returns one {@link StandingsGroupDto} per group with teams ranked by
 * current points, goal difference, and goals scored.
 */
@RestController
@RequestMapping("/api/standings")
public class StandingsController {

    private final WorldCupDataProvider dataProvider;

    /**
     * @param dataProvider injected provider implementation (ESPN by default)
     */
    public StandingsController(WorldCupDataProvider dataProvider) {
        this.dataProvider = dataProvider;
    }

    /**
     * Returns current standings for all 12 groups.
     *
     * @return 200 with standings list; empty list body if the provider fails
     */
    @GetMapping
    public ResponseEntity<List<StandingsGroupDto>> getStandings() {
        return ResponseEntity.ok(dataProvider.getStandings());
    }
}
