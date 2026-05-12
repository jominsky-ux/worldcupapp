package com.jominsky.worldcupapp.service;

import com.jominsky.worldcupapp.dto.EntryPicksResponse;
import com.jominsky.worldcupapp.dto.GroupStagePickRequest;
import com.jominsky.worldcupapp.dto.GroupStagePickResponse;
import com.jominsky.worldcupapp.dto.KnockoutPickRequest;
import com.jominsky.worldcupapp.dto.KnockoutPickResponse;
import com.jominsky.worldcupapp.dto.SquadPickRequest;
import com.jominsky.worldcupapp.dto.SquadSlot;
import com.jominsky.worldcupapp.dto.ThirdPlacePickRequest;
import com.jominsky.worldcupapp.dto.ThirdPlaceSelection;
import com.jominsky.worldcupapp.model.Entry;
import com.jominsky.worldcupapp.model.GroupStagePick;
import com.jominsky.worldcupapp.model.KnockoutPick;
import com.jominsky.worldcupapp.model.SquadPick;
import com.jominsky.worldcupapp.model.ThirdPlacePick;
import com.jominsky.worldcupapp.repository.EntryRepository;
import com.jominsky.worldcupapp.repository.GroupStagePickRepository;
import com.jominsky.worldcupapp.repository.KnockoutPickRepository;
import com.jominsky.worldcupapp.repository.SquadPickRepository;
import com.jominsky.worldcupapp.repository.ThirdPlacePickRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PickService {

    private static final int THIRD_PLACE_PICK_COUNT = 8;
    private static final int SQUAD_SIZE = 11;

    /**
     * Allowed formations mapped to [DEF, MID, FWD] counts.
     * GK is always 1; the three values here must sum to 10.
     */
    private static final Map<String, int[]> FORMATIONS = Map.of(
            "3-5-2", new int[]{3, 5, 2},
            "3-4-3", new int[]{3, 4, 3},
            "4-5-1", new int[]{4, 5, 1},
            "4-4-2", new int[]{4, 4, 2},
            "4-3-3", new int[]{4, 3, 3},
            "5-4-1", new int[]{5, 4, 1},
            "5-3-2", new int[]{5, 3, 2},
            "5-2-3", new int[]{5, 2, 3}
    );

    private static final Map<String, Integer> POSITION_ORDER = Map.of(
            "GK", 1, "DEF", 2, "MID", 3, "FWD", 4);

    private final EntryService entryService;
    private final EntryRepository entryRepository;
    private final GroupStagePickRepository groupStagePickRepository;
    private final ThirdPlacePickRepository thirdPlacePickRepository;
    private final KnockoutPickRepository knockoutPickRepository;
    private final SquadPickRepository squadPickRepository;

    public PickService(
            EntryService entryService,
            EntryRepository entryRepository,
            GroupStagePickRepository groupStagePickRepository,
            ThirdPlacePickRepository thirdPlacePickRepository,
            KnockoutPickRepository knockoutPickRepository,
            SquadPickRepository squadPickRepository) {
        this.entryService = entryService;
        this.entryRepository = entryRepository;
        this.groupStagePickRepository = groupStagePickRepository;
        this.thirdPlacePickRepository = thirdPlacePickRepository;
        this.knockoutPickRepository = knockoutPickRepository;
        this.squadPickRepository = squadPickRepository;
    }

    public EntryPicksResponse getPicksForEntry(UUID entryId, String email) {
        Entry entry = entryService.loadAndVerifyOwnership(entryId, email);
        return toEntryPicksResponse(entry);
    }

    @Transactional
    public GroupStagePickResponse upsertGroupStagePick(UUID entryId, String email,
            GroupStagePickRequest request) {
        Entry entry = entryService.loadAndVerifyOwnership(entryId, email);
        GroupStagePick pick = groupStagePickRepository
                .findByEntryAndGroupId(entry, request.groupId())
                .orElseGet(GroupStagePick::new);
        pick.setEntry(entry);
        pick.setGroupId(request.groupId());
        pick.setFirstPlaceTeamId(request.firstPlaceTeamId());
        pick.setSecondPlaceTeamId(request.secondPlaceTeamId());
        return toGroupResponse(groupStagePickRepository.save(pick));
    }

    @Transactional
    public List<ThirdPlaceSelection> replaceThirdPlacePicks(UUID entryId, String email,
            ThirdPlacePickRequest request) {
        List<ThirdPlaceSelection> selections = request.picks();
        if (selections == null || selections.size() != THIRD_PLACE_PICK_COUNT) {
            throw new IllegalArgumentException(
                    "Exactly " + THIRD_PLACE_PICK_COUNT + " third-place picks must be submitted.");
        }
        long distinctGroups = selections.stream().map(ThirdPlaceSelection::groupId).distinct().count();
        if (distinctGroups != THIRD_PLACE_PICK_COUNT) {
            throw new IllegalArgumentException(
                    "Each third-place pick must come from a different group.");
        }
        Entry entry = entryService.loadAndVerifyOwnership(entryId, email);
        thirdPlacePickRepository.deleteByEntry(entry);
        thirdPlacePickRepository.flush();
        List<ThirdPlacePick> picks = selections.stream().map(sel -> {
            ThirdPlacePick pick = new ThirdPlacePick();
            pick.setEntry(entry);
            pick.setGroupId(sel.groupId());
            pick.setTeamId(sel.teamId());
            return pick;
        }).toList();
        thirdPlacePickRepository.saveAll(picks);
        return selections;
    }

    @Transactional
    public KnockoutPickResponse upsertKnockoutPick(UUID entryId, String email,
            KnockoutPickRequest request) {
        Entry entry = entryService.loadAndVerifyOwnership(entryId, email);
        KnockoutPick pick = knockoutPickRepository
                .findByEntryAndMatchEventId(entry, request.matchEventId())
                .orElseGet(KnockoutPick::new);
        pick.setEntry(entry);
        pick.setMatchEventId(request.matchEventId());
        pick.setWinnerTeamId(request.winnerTeamId());
        return toKnockoutResponse(knockoutPickRepository.save(pick));
    }

    @Transactional
    public List<SquadSlot> replaceSquadPicks(UUID entryId, String email, SquadPickRequest request) {
        List<SquadSlot> players = request.players();
        String formation = request.formation();

        int[] expected = FORMATIONS.get(formation);
        if (expected == null) {
            throw new IllegalArgumentException(
                    "Unsupported formation: " + formation + ". Supported: " + FORMATIONS.keySet());
        }
        if (players == null || players.size() != SQUAD_SIZE) {
            throw new IllegalArgumentException("Exactly " + SQUAD_SIZE + " players must be submitted.");
        }

        long gkCount  = players.stream().filter(p -> "GK".equals(p.position())).count();
        long defCount = players.stream().filter(p -> "DEF".equals(p.position())).count();
        long midCount = players.stream().filter(p -> "MID".equals(p.position())).count();
        long fwdCount = players.stream().filter(p -> "FWD".equals(p.position())).count();

        if (gkCount != 1) {
            throw new IllegalArgumentException("Squad must contain exactly 1 goalkeeper.");
        }
        if (defCount != expected[0] || midCount != expected[1] || fwdCount != expected[2]) {
            throw new IllegalArgumentException(
                    "Formation " + formation + " requires " + expected[0] + " DEF, "
                    + expected[1] + " MID, " + expected[2] + " FWD.");
        }
        long distinctAthletes = players.stream().map(SquadSlot::athleteId).distinct().count();
        if (distinctAthletes != SQUAD_SIZE) {
            throw new IllegalArgumentException("Duplicate athletes are not allowed in the squad.");
        }

        Entry entry = entryService.loadAndVerifyOwnership(entryId, email);
        entry.setFormation(formation);
        entryRepository.save(entry);

        squadPickRepository.deleteByEntry(entry);
        squadPickRepository.flush();

        List<SquadPick> picks = players.stream().map(slot -> {
            SquadPick pick = new SquadPick();
            pick.setEntry(entry);
            pick.setPosition(slot.position());
            pick.setAthleteId(slot.athleteId());
            return pick;
        }).toList();
        squadPickRepository.saveAll(picks);

        return players;
    }

    private EntryPicksResponse toEntryPicksResponse(Entry entry) {
        List<SquadSlot> squadSlots = squadPickRepository.findByEntry(entry).stream()
                .sorted(Comparator.comparingInt(p -> POSITION_ORDER.getOrDefault(p.getPosition(), 99)))
                .map(p -> new SquadSlot(p.getPosition(), p.getAthleteId()))
                .toList();

        return new EntryPicksResponse(
                entry.getId(),
                entry.getEntryNumber(),
                entry.getName(),
                entry.getFormation(),
                groupStagePickRepository.findByEntry(entry).stream()
                        .map(this::toGroupResponse).toList(),
                thirdPlacePickRepository.findByEntry(entry).stream()
                        .map(p -> new ThirdPlaceSelection(p.getGroupId(), p.getTeamId())).toList(),
                knockoutPickRepository.findByEntry(entry).stream()
                        .map(this::toKnockoutResponse).toList(),
                squadSlots);
    }

    private GroupStagePickResponse toGroupResponse(GroupStagePick pick) {
        return new GroupStagePickResponse(pick.getId(), pick.getGroupId(),
                pick.getFirstPlaceTeamId(), pick.getSecondPlaceTeamId(),
                pick.getCreatedAt(), pick.getUpdatedAt());
    }

    private KnockoutPickResponse toKnockoutResponse(KnockoutPick pick) {
        return new KnockoutPickResponse(pick.getId(), pick.getMatchEventId(),
                pick.getWinnerTeamId(), pick.getCreatedAt(), pick.getUpdatedAt());
    }
}
