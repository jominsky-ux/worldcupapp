package com.jominsky.worldcupapp.controller;

import com.jominsky.worldcupapp.dto.BracketMatchupDto;
import com.jominsky.worldcupapp.dto.TournamentStatusDto;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller that exposes current tournament phase and live-match status.
 *
 * Consumed by the React frontend's {@code useTournamentInfo()} hook (polled every
 * 60 seconds) to determine whether pick submission pages should be locked and
 * whether to display a live-match indicator in the UI.
 */
@RestController
@RequestMapping("/api/tournament")
public class TournamentController {

    private final WorldCupDataProvider dataProvider;

    /**
     * @param dataProvider injected provider implementation (ESPN by default)
     */
    public TournamentController(WorldCupDataProvider dataProvider) {
        this.dataProvider = dataProvider;
    }

    /**
     * Returns a snapshot of the current tournament phase, whether any match is
     * live, and the timestamp of the next scheduled kick-off.
     *
     * This endpoint corresponds to {@code GET /api/tournament/status} as
     * referenced in the frontend's {@code useGameData.js} hook.
     *
     * @return 200 with tournament status; never 404 (returns "unknown" phase on failure)
     */
    @GetMapping("/status")
    public ResponseEntity<TournamentStatusDto> getTournamentStatus() {
        return ResponseEntity.ok(dataProvider.getTournamentStatus());
    }

    /**
     * Returns the 16 Round of 32 matchups with real competitor team data from ESPN.
     * The frontend bracket picker calls this instead of using hardcoded mock teams.
     *
     * @return 200 with list of matchups in bracket visual order; empty list on failure
     */
    @GetMapping("/bracket")
    public ResponseEntity<List<BracketMatchupDto>> getBracketMatchups() {
        return ResponseEntity.ok(dataProvider.getBracketMatchups());
    }
}
