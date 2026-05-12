package com.jominsky.worldcupapp.controller;

import com.jominsky.worldcupapp.dto.EntryRequest;
import com.jominsky.worldcupapp.dto.EntryResponse;
import com.jominsky.worldcupapp.service.EntryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/entries")
public class EntriesController {

    private final EntryService entryService;

    public EntriesController(EntryService entryService) {
        this.entryService = entryService;
    }

    @GetMapping
    public ResponseEntity<List<EntryResponse>> getMyEntries(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(entryService.getEntries(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<EntryResponse> createEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody EntryRequest request) {
        return ResponseEntity.ok(entryService.createEntry(userDetails.getUsername(), request));
    }
}
