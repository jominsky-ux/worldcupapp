package com.jominsky.worldcupapp.controller;

import com.jominsky.worldcupapp.dto.EntryPicksResponse;
import com.jominsky.worldcupapp.dto.GroupStagePickRequest;
import com.jominsky.worldcupapp.dto.GroupStagePickResponse;
import com.jominsky.worldcupapp.dto.KnockoutPickRequest;
import com.jominsky.worldcupapp.dto.KnockoutPickResponse;
import com.jominsky.worldcupapp.dto.SquadPickRequest;
import com.jominsky.worldcupapp.dto.SquadSlot;
import com.jominsky.worldcupapp.dto.ThirdPlacePickRequest;
import com.jominsky.worldcupapp.dto.ThirdPlaceSelection;
import com.jominsky.worldcupapp.dto.TournamentStatusDto;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import com.jominsky.worldcupapp.service.PickService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/entries/{entryId}/picks")
public class PicksController {

    private final PickService pickService;
    private final WorldCupDataProvider dataProvider;

    public PicksController(PickService pickService, WorldCupDataProvider dataProvider) {
        this.pickService  = pickService;
        this.dataProvider = dataProvider;
    }

    @GetMapping
    public ResponseEntity<EntryPicksResponse> getPicks(
            @PathVariable UUID entryId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(pickService.getPicksForEntry(entryId, userDetails.getUsername()));
    }

    @PutMapping("/groups")
    public ResponseEntity<GroupStagePickResponse> upsertGroupStagePick(
            @PathVariable UUID entryId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody GroupStagePickRequest request) {
        requireGroupPicksOpen();
        return ResponseEntity.ok(
                pickService.upsertGroupStagePick(entryId, userDetails.getUsername(), request));
    }

    @PutMapping("/third-place")
    public ResponseEntity<List<ThirdPlaceSelection>> replaceThirdPlacePicks(
            @PathVariable UUID entryId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ThirdPlacePickRequest request) {
        requireGroupPicksOpen();
        return ResponseEntity.ok(
                pickService.replaceThirdPlacePicks(entryId, userDetails.getUsername(), request));
    }

    @PutMapping("/knockout")
    public ResponseEntity<KnockoutPickResponse> upsertKnockoutPick(
            @PathVariable UUID entryId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody KnockoutPickRequest request) {
        requireBracketPicksOpen();
        return ResponseEntity.ok(
                pickService.upsertKnockoutPick(entryId, userDetails.getUsername(), request));
    }

    @PutMapping("/squad")
    public ResponseEntity<List<SquadSlot>> replaceSquadPicks(
            @PathVariable UUID entryId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SquadPickRequest request) {
        TournamentStatusDto status = dataProvider.getTournamentStatus();
        if (!status.groupPicksOpen() && !status.bracketPicksOpen()) {
            throw new ResponseStatusException(HttpStatus.LOCKED, "Squad picks are closed.");
        }
        return ResponseEntity.ok(
                pickService.replaceSquadPicks(entryId, userDetails.getUsername(), request));
    }

    private void requireGroupPicksOpen() {
        if (!dataProvider.getTournamentStatus().groupPicksOpen()) {
            throw new ResponseStatusException(HttpStatus.LOCKED, "Group picks are closed.");
        }
    }

    private void requireBracketPicksOpen() {
        if (!dataProvider.getTournamentStatus().bracketPicksOpen()) {
            throw new ResponseStatusException(HttpStatus.LOCKED, "Bracket picks are closed.");
        }
    }
}
