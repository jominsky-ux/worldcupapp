package com.jominsky.worldcupapp.controller;

import com.jominsky.worldcupapp.dto.MatchSummaryDto;
import com.jominsky.worldcupapp.dto.ScoreboardDto;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for match data: the scoreboard and per-match goal/assist summaries.
 *
 * Typical usage flow from the frontend:
 * <ol>
 *   <li>Fetch {@code GET /api/matches} to get the scoreboard with event IDs.</li>
 *   <li>For a match of interest, fetch {@code GET /api/matches/{eventId}/summary}
 *       to get goals and assists.</li>
 * </ol>
 */
@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final WorldCupDataProvider dataProvider;

    /**
     * @param dataProvider injected provider implementation (ESPN by default)
     */
    public MatchController(WorldCupDataProvider dataProvider) {
        this.dataProvider = dataProvider;
    }

    /**
     * Returns all matches visible in the current ESPN scoreboard window
     * (scheduled, live, and recently completed).
     *
     * @return 200 with scoreboard DTO; the matches list may be empty if no
     *         matches are scheduled in the current window
     */
    @GetMapping
    public ResponseEntity<ScoreboardDto> getScoreboard() {
        return ResponseEntity.ok(dataProvider.getScoreboard());
    }

    /**
     * Returns detailed scoring information for a specific match, including
     * each goal with scorer name, assist name (when recorded), and match minute.
     *
     * @param eventId the ESPN event identifier obtained from the scoreboard response
     * @return 200 with match summary, or 404 if the event ID is not recognised
     */
    @GetMapping("/{eventId}/summary")
    public ResponseEntity<MatchSummaryDto> getMatchSummary(@PathVariable String eventId) {
        MatchSummaryDto summary = dataProvider.getMatchSummary(eventId);
        if (summary == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(summary);
    }
}
