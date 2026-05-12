package com.jominsky.worldcupapp.controller;

import com.jominsky.worldcupapp.dto.GroupDto;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller that exposes World Cup group and team data.
 *
 * Consumed by the React frontend's {@code useGroups()} hook, which populates
 * the team-selection dropdowns on GroupStagePage.
 */
@RestController
@RequestMapping("/api/groups")
public class GroupsController {

    private final WorldCupDataProvider dataProvider;

    /**
     * @param dataProvider injected provider implementation (ESPN by default)
     */
    public GroupsController(WorldCupDataProvider dataProvider) {
        this.dataProvider = dataProvider;
    }

    /**
     * Returns all 12 World Cup groups, each containing their four member teams.
     *
     * @return 200 with the group list; empty list body if the provider fails
     */
    @GetMapping
    public ResponseEntity<List<GroupDto>> getGroups() {
        return ResponseEntity.ok(dataProvider.getGroups());
    }
}
