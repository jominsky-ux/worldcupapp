package com.jominsky.worldcupapp.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.jominsky.worldcupapp.dto.EntryScoreDto;
import com.jominsky.worldcupapp.dto.GroupDto;
import com.jominsky.worldcupapp.dto.LeaderboardEntryDto;
import com.jominsky.worldcupapp.dto.StandingsGroupDto;
import com.jominsky.worldcupapp.dto.TournamentStatusDto;
import com.jominsky.worldcupapp.model.Entry;
import com.jominsky.worldcupapp.model.GroupStagePick;
import com.jominsky.worldcupapp.model.KnockoutPick;
import com.jominsky.worldcupapp.model.SquadPick;
import com.jominsky.worldcupapp.model.ThirdPlacePick;
import com.jominsky.worldcupapp.model.User;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import com.jominsky.worldcupapp.repository.EntryRepository;
import com.jominsky.worldcupapp.repository.GroupStagePickRepository;
import com.jominsky.worldcupapp.repository.KnockoutPickRepository;
import com.jominsky.worldcupapp.repository.PlayerMatchStatsRepository;
import com.jominsky.worldcupapp.repository.SquadPickRepository;
import com.jominsky.worldcupapp.repository.ThirdPlacePickRepository;
import com.jominsky.worldcupapp.repository.UserRepository;

/**
 * Computes fantasy points for entries and produces the global leaderboard.
 *
 * Scoring rules (matches the frontend constants in entries.js):
 *
 * Group stage picks (per group):
 * Correct 1st place: +4 pts
 * Correct 2nd place: +2 pts
 * All 12 groups correct (both 1st & 2nd): +20 bonus
 *
 * 3rd-place picks (8 picks allowed):
 * Each correct pick: +1 pt
 * All 8 correct: +10 bonus
 *
 * Knockout bracket picks (scoring by round encoded in matchEventId prefix):
 * R32 winner: +4 pts
 * R16 winner: +8 pts
 * QF winner: +16 pts
 * SF winner: +32 pts
 * Final winner: +64 pts
 *
 * Squad player points: sum of player_match_stats.total_points for each
 * athlete in the entry's squad.
 */
@Service
public class ScoringService {

    // Group stage scoring
    private static final int POINTS_CORRECT_FIRST = 4;
    private static final int POINTS_CORRECT_SECOND = 2;
    private static final int BONUS_ALL_GROUPS = 20;

    // 3rd-place scoring
    private static final int POINTS_THIRD_PLACE = 1;
    private static final int BONUS_ALL_THIRD_PLACE = 10;
    private static final int TOTAL_THIRD_PLACE_PICKS = 8;

    // Knockout scoring keyed by ESPN event ID (2026 World Cup, matches 73-104).
    private static final Map<String, Integer> KNOCKOUT_POINTS = Map.ofEntries(
            // Round of 32 — ESPN matches 73-88 (+4 each)
            Map.entry("760486", 4), Map.entry("760489", 4), Map.entry("760488", 4), Map.entry("760487", 4),
            Map.entry("760492", 4), Map.entry("760490", 4), Map.entry("760491", 4), Map.entry("760495", 4),
            Map.entry("760494", 4), Map.entry("760493", 4), Map.entry("760496", 4), Map.entry("760497", 4),
            Map.entry("760498", 4), Map.entry("760500", 4), Map.entry("760501", 4), Map.entry("760499", 4),
            // Round of 16 — ESPN matches 89-96 (+8 each)
            Map.entry("760503", 8), Map.entry("760502", 8), Map.entry("760504", 8), Map.entry("760505", 8),
            Map.entry("760506", 8), Map.entry("760507", 8), Map.entry("760509", 8), Map.entry("760508", 8),
            // Quarterfinals — ESPN matches 97-100 (+16 each)
            Map.entry("760510", 16), Map.entry("760512", 16), Map.entry("760511", 16), Map.entry("760513", 16),
            // Semifinals — ESPN matches 101-102 (+32 each)
            Map.entry("760514", 32), Map.entry("760515", 32),
            // Final — ESPN match 104 (+64)
            Map.entry("760517", 64));

    // ESPN phase strings that indicate knockout matches are being played.
    private static final Set<String> KNOCKOUT_PHASES = Set.of(
            "round-of-32", "round-of-16", "quarter", "semi", "final");

    private final WorldCupDataProvider dataProvider;
    private final UserRepository userRepository;
    private final EntryRepository entryRepository;
    private final GroupStagePickRepository groupStagePickRepository;
    private final ThirdPlacePickRepository thirdPlacePickRepository;
    private final KnockoutPickRepository knockoutPickRepository;
    private final SquadPickRepository squadPickRepository;
    private final PlayerMatchStatsRepository statsRepository;

    public ScoringService(
            WorldCupDataProvider dataProvider,
            UserRepository userRepository,
            EntryRepository entryRepository,
            GroupStagePickRepository groupStagePickRepository,
            ThirdPlacePickRepository thirdPlacePickRepository,
            KnockoutPickRepository knockoutPickRepository,
            SquadPickRepository squadPickRepository,
            PlayerMatchStatsRepository statsRepository) {
        this.dataProvider = dataProvider;
        this.userRepository = userRepository;
        this.entryRepository = entryRepository;
        this.groupStagePickRepository = groupStagePickRepository;
        this.thirdPlacePickRepository = thirdPlacePickRepository;
        this.knockoutPickRepository = knockoutPickRepository;
        this.squadPickRepository = squadPickRepository;
        this.statsRepository = statsRepository;
    }

    /**
     * Returns the global leaderboard: one row per entry, ranked by total points
     * descending. Users with no entries are excluded.
     */
    public List<LeaderboardEntryDto> getLeaderboard() {
        TournamentStatusDto status = dataProvider.getTournamentStatus();
        Map<String, Integer> athletePoints = buildAthletePointsMap();
        Map<String, GroupPositions> groupPositions = buildGroupPositionsMap(status);

        List<Entry> allEntries = entryRepository.findAll();
        List<LeaderboardEntryDto> rows = new ArrayList<>();

        for (Entry entry : allEntries) {
            EntryScoreDto score = scoreEntry(entry, groupPositions, athletePoints, status);
            User user = entry.getUser();
            rows.add(new LeaderboardEntryDto(0, user.getDisplayName(), user.getEmail(),
                    entry.getEntryNumber(), entry.getName(), score.totalPoints()));
        }

        rows.sort(Comparator.comparingInt(LeaderboardEntryDto::totalPoints).reversed());

        List<LeaderboardEntryDto> ranked = new ArrayList<>(rows.size());
        int rank = 0;
        int prevPoints = Integer.MIN_VALUE;
        for (LeaderboardEntryDto r : rows) {
            if (r.totalPoints() != prevPoints) {
                rank++;
                prevPoints = r.totalPoints();
            }
            ranked.add(new LeaderboardEntryDto(rank, r.displayName(), r.email(),
                    r.entryNumber(), r.entryName(), r.totalPoints()));
        }
        return ranked;
    }

    /**
     * Computes the score breakdown for every entry belonging to the given user.
     */
    public List<EntryScoreDto> getEntryScores(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        TournamentStatusDto status = dataProvider.getTournamentStatus();
        Map<String, Integer> athletePoints = buildAthletePointsMap();
        Map<String, GroupPositions> groupPositions = buildGroupPositionsMap(status);

        return entryRepository.findByUserOrderByEntryNumber(user).stream()
                .map(entry -> scoreEntry(entry, groupPositions, athletePoints, status))
                .toList();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private EntryScoreDto scoreEntry(Entry entry,
            Map<String, GroupPositions> groupPositions,
            Map<String, Integer> athletePoints,
            TournamentStatusDto status) {
        int groupPts   = scoreGroupPicks(entry, groupPositions);
        int thirdPts   = scoreThirdPlacePicks(entry, groupPositions);
        int bracketPts = scoreBracketPicks(entry, status);
        int squadPts   = scoreSquad(entry, athletePoints);
        int total      = groupPts + thirdPts + bracketPts + squadPts;

        return new EntryScoreDto(entry.getId(), entry.getEntryNumber(), entry.getName(),
                groupPts, thirdPts, bracketPts, squadPts, total);
    }

    private int scoreGroupPicks(Entry entry, Map<String, GroupPositions> groupPositions) {
        List<GroupStagePick> picks = groupStagePickRepository.findByEntry(entry);
        int pts = 0;
        int fullyCorrect = 0;

        for (GroupStagePick pick : picks) {
            GroupPositions actual = groupPositions.get(pick.getGroupId());
            if (actual == null)
                continue;

            boolean firstCorrect = pick.getFirstPlaceTeamId() != null
                    && pick.getFirstPlaceTeamId().equals(actual.first());
            boolean secondCorrect = pick.getSecondPlaceTeamId() != null
                    && pick.getSecondPlaceTeamId().equals(actual.second());

            if (firstCorrect)
                pts += POINTS_CORRECT_FIRST;
            if (secondCorrect)
                pts += POINTS_CORRECT_SECOND;
            if (firstCorrect && secondCorrect)
                fullyCorrect++;
        }

        if (fullyCorrect == groupPositions.size() && !groupPositions.isEmpty()) {
            pts += BONUS_ALL_GROUPS;
        }
        return pts;
    }

    private int scoreThirdPlacePicks(Entry entry, Map<String, GroupPositions> groupPositions) {
        List<ThirdPlacePick> picks = thirdPlacePickRepository.findByEntry(entry);
        int pts = 0;
        int correct = 0;

        for (ThirdPlacePick pick : picks) {
            GroupPositions actual = groupPositions.get(pick.getGroupId());
            if (actual == null)
                continue;
            if (pick.getTeamId() != null && pick.getTeamId().equals(actual.third())) {
                pts += POINTS_THIRD_PLACE;
                correct++;
            }
        }

        if (correct == TOTAL_THIRD_PLACE_PICKS) {
            pts += BONUS_ALL_THIRD_PLACE;
        }
        return pts;
    }

    private int scoreBracketPicks(Entry entry, TournamentStatusDto status) {
        // Only score once knockout matches are actually being played.
        // During PRE_TOURNAMENT and GROUP_STAGE no knockout games have occurred;
        // during PRE_KNOCKOUT picks are open but no matches have started yet.
        if (!KNOCKOUT_PHASES.contains(status.phase())) {
            return 0;
        }

        List<KnockoutPick> picks = knockoutPickRepository.findByEntry(entry);
        int pts = 0;
        for (KnockoutPick pick : picks) {
            Integer roundPts = KNOCKOUT_POINTS.get(pick.getMatchEventId());
            if (roundPts != null) {
                pts += roundPts;
            }
        }
        return pts;
    }

    private int scoreSquad(Entry entry, Map<String, Integer> athletePoints) {
        List<SquadPick> squad = squadPickRepository.findByEntry(entry);
        return squad.stream()
                .mapToInt(p -> athletePoints.getOrDefault(p.getAthleteId(), 0))
                .sum();
    }

    /**
     * Builds a map from groupId → {first, second, third} team IDs using live
     * standings. Returns an empty map before the tournament starts to prevent
     * ESPN's pre-seeded team ordering from being treated as real results.
     */
    private Map<String, GroupPositions> buildGroupPositionsMap(TournamentStatusDto status) {
        if (status.groupPicksOpen()) {
            return Map.of();
        }

        List<GroupDto> groups = dataProvider.getGroups();
        List<StandingsGroupDto> standings = dataProvider.getStandings();

        Map<String, String> nameToGroupId = new HashMap<>();
        for (GroupDto g : groups) {
            nameToGroupId.put(g.name(), g.id());
        }

        Map<String, GroupPositions> result = new HashMap<>();
        for (StandingsGroupDto sg : standings) {
            String groupId = nameToGroupId.get(sg.groupName());
            if (groupId == null || sg.teams().size() < 3)
                continue;
            result.put(groupId, new GroupPositions(
                    sg.teams().get(0).team().id(),
                    sg.teams().get(1).team().id(),
                    sg.teams().get(2).team().id()));
        }
        return result;
    }

    /**
     * Builds a map from athleteId → total fantasy points from player_match_stats.
     */
    private Map<String, Integer> buildAthletePointsMap() {
        List<Object[]> rows = statsRepository.sumPointsByAthlete();
        Map<String, Integer> map = new HashMap<>(rows.size() * 2);
        for (Object[] row : rows) {
            map.put((String) row[0], ((Number) row[1]).intValue());
        }
        return map;
    }

    /** Immutable positions for a single group from the standings. */
    private record GroupPositions(String first, String second, String third) {
    }
}
