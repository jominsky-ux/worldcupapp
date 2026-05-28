package com.jominsky.worldcupapp.controller;

import com.jominsky.worldcupapp.dto.EntryScoreDto;
import com.jominsky.worldcupapp.dto.LeaderboardEntryDto;
import com.jominsky.worldcupapp.service.ScoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class LeaderboardController {

    private final ScoringService scoringService;

    public LeaderboardController(ScoringService scoringService) {
        this.scoringService = scoringService;
    }

    /**
     * Returns all users ranked by total points, descending.
     * Publicly accessible — no authentication required to view the leaderboard.
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDto>> getLeaderboard() {
        return ResponseEntity.ok(scoringService.getLeaderboard());
    }

    /**
     * Returns the score breakdown for every entry owned by the authenticated user.
     * Used by the dashboard to display per-entry point totals.
     */
    @GetMapping("/entries/scores")
    public ResponseEntity<List<EntryScoreDto>> getMyEntryScores(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(scoringService.getEntryScores(userDetails.getUsername()));
    }
}
