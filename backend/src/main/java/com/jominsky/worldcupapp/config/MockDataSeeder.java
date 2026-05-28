package com.jominsky.worldcupapp.config;

import com.jominsky.worldcupapp.dto.AthleteDto;
import com.jominsky.worldcupapp.dto.GroupDto;
import com.jominsky.worldcupapp.dto.TeamDto;
import com.jominsky.worldcupapp.model.*;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import com.jominsky.worldcupapp.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Loads realistic mock data when the "local" profile is active.
 *
 * Controlled by app.mock.data-mode in application-local.properties:
 *   NONE        – skip entirely (default)
 *   GROUP_STAGE – 12 users + entries + group/third-place/squad picks, no knockout picks
 *                 (use this to test the bracket-picks UI before the knockout stage)
 *   FULL        – everything above + knockout picks + player match stats
 *                 (use this to test the leaderboard)
 *
 * Group, third-place, and squad picks are seeded from live ESPN data fetched at
 * startup, so they always reference real team IDs and athlete IDs. Squad picks
 * will therefore highlight correctly in the Squad UI.
 *
 * Test credentials: user01@mock.wc26 … user12@mock.wc26 / password
 */
@Component
@Profile("local")
@Order(2)
public class MockDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MockDataSeeder.class);

    // ── Canonical knockout bracket ──────────────────────────────────────────
    // Each row: {matchEventId, correctWinnerTeamId, alternateTeamId}
    // matchEventId values are real ESPN event IDs from the 2026 World Cup schedule,
    // matching ROUND_MATCHUP_IDS in bracket.js. Team IDs are frontend mock integers
    // so that BracketPage's BRACKET_TEAM_LOOKUP can resolve them.
    // Results match MOCK_KNOCKOUT_RESULTS in bracket.js: France beats England in the final.
    private static final String[][] BRACKET = {
            // Round of 32 — ESPN matches 73-88
            {"760486", "1",  "8"},   // Mexico      vs Switzerland  → Mexico
            {"760489", "9",  "16"},  // Brazil      vs Türkiye      → Brazil
            {"760488", "17", "22"},  // Germany     vs Japan        → Germany
            {"760487", "21", "20"},  // Netherlands vs Ecuador      → Netherlands
            {"760492", "25", "32"},  // Belgium     vs Uruguay      → Belgium
            {"760490", "29", "26"},  // Spain       vs Egypt        → Spain
            {"760491", "33", "40"},  // France      vs Austria      → France
            {"760495", "37", "34"},  // Argentina   vs Senegal      → Argentina
            {"760494", "3",  "5"},   // South Korea vs Canada       → South Korea
            {"760493", "13", "10"},  // USA         vs Morocco      → USA
            {"760496", "19", "23"},  // Ivory Coast vs Sweden       → Ivory Coast
            {"760497", "41", "46"},  // Portugal    vs Croatia      → Portugal
            {"760498", "36", "27"},  // Norway      vs Iran         → Norway
            {"760500", "45", "42"},  // England     vs Colombia     → England
            {"760501", "15", "38"},  // Australia   vs Algeria      → Australia
            {"760499", "14", "24"},  // Paraguay    vs Tunisia      → Paraguay
            // Round of 16 — ESPN matches 89-96
            {"760503", "9",  "1"},   // Brazil      beats Mexico
            {"760502", "21", "17"},  // Netherlands beats Germany
            {"760504", "29", "25"},  // Spain       beats Belgium
            {"760505", "33", "37"},  // France      beats Argentina
            {"760506", "13", "3"},   // USA         beats South Korea
            {"760507", "41", "19"},  // Portugal    beats Ivory Coast
            {"760509", "45", "36"},  // England     beats Norway
            {"760508", "15", "14"},  // Australia   beats Paraguay
            // Quarter-finals — ESPN matches 97, 99, 98, 100 (visual bracket order)
            {"760510", "9",  "21"},  // Brazil      beats Netherlands
            {"760512", "33", "29"},  // France      beats Spain
            {"760511", "41", "13"},  // Portugal    beats USA
            {"760513", "45", "15"},  // England     beats Australia
            // Semi-finals — ESPN matches 101-102
            {"760514", "33", "9"},   // France      beats Brazil
            {"760515", "45", "41"},  // England     beats Portugal
            // Final — ESPN match 104
            {"760517", "33", "45"},  // France      beats England
    };

    // Round sets used in seedKnockoutPicks to determine pick profile behaviour.
    private static final Set<String> R32_EVENT_IDS = Set.of(
            "760486", "760489", "760488", "760487", "760492", "760490", "760491", "760495",
            "760494", "760493", "760496", "760497", "760498", "760500", "760501", "760499"
    );
    private static final Set<String> R16_EVENT_IDS = Set.of(
            "760503", "760502", "760504", "760505", "760506", "760507", "760509", "760508"
    );

    // ── 5 formation templates ──────────────────────────────────────────────────
    // Athletes are selected dynamically from ESPN rosters using GK/DEF/MID/FWD
    // offsets below; no hard-coded mock IDs.
    private static final String[] SQUAD_FORMATIONS = {
            "4-3-3",  // SQUAD 0: 1 GK, 4 DEF, 3 MID, 3 FWD
            "4-4-2",  // SQUAD 1: 1 GK, 4 DEF, 4 MID, 2 FWD
            "3-5-2",  // SQUAD 2: 1 GK, 3 DEF, 5 MID, 2 FWD
            "5-3-2",  // SQUAD 3: 1 GK, 5 DEF, 3 MID, 2 FWD
            "4-5-1",  // SQUAD 4: 1 GK, 4 DEF, 5 MID, 1 FWD
    };

    // ── Position offsets per squad template ─────────────────────────────────
    // Each template picks athletes from the ESPN roster at these starting
    // indices so that different templates use different athletes (no hard-coded
    // mock IDs). Offsets are cumulative sums of the per-position counts above.
    // GK cumsum(1,1,1,1,1):     [0,  1,  2,  3,  4]
    // DEF cumsum(4,4,3,5,4):    [0,  4,  8, 11, 16]
    // MID cumsum(3,4,5,3,5):    [0,  3,  7, 12, 15]
    // FWD cumsum(3,2,2,2,1):    [0,  3,  5,  7,  9]
    private static final int[] GK_OFFSETS  = {0,  1,  2,  3,  4};
    private static final int[] DEF_OFFSETS = {0,  4,  8, 11, 16};
    private static final int[] MID_OFFSETS = {0,  3,  7, 12, 15};
    private static final int[] FWD_OFFSETS = {0,  3,  5,  7,  9};

    // ── User plan: {displayName prefix, entryCount, squadOffset, pickProfile} ─
    // pickProfile: 0=SHARP, 1=AVERAGE, 2=WILD
    private static final Object[][] USER_PLAN = {
            {"Alpha",   3, 0, 0},  // user01 – 3 entries, sharp
            {"Beta",    3, 1, 0},  // user02 – 3 entries, sharp
            {"Gamma",   3, 2, 1},  // user03 – 3 entries, average
            {"Delta",   2, 3, 1},  // user04 – 2 entries, average
            {"Epsilon", 2, 4, 1},  // user05 – 2 entries, average
            {"Zeta",    2, 0, 2},  // user06 – 2 entries, wild
            {"Eta",     2, 1, 2},  // user07 – 2 entries, wild
            {"Theta",   1, 2, 0},  // user08 – 1 entry,  sharp
            {"Iota",    1, 3, 1},  // user09 – 1 entry,  average
            {"Kappa",   1, 4, 2},  // user10 – 1 entry,  wild
            {"Lambda",  1, 0, 0},  // user11 – 1 entry,  sharp
            {"Mu",      1, 1, 1},  // user12 – 1 entry,  average
    };

    private final UserRepository userRepository;
    private final EntryRepository entryRepository;
    private final GroupStagePickRepository groupStagePickRepository;
    private final ThirdPlacePickRepository thirdPlacePickRepository;
    private final KnockoutPickRepository knockoutPickRepository;
    private final SquadPickRepository squadPickRepository;
    private final PlayerMatchStatsRepository playerMatchStatsRepository;
    private final PasswordEncoder passwordEncoder;
    private final WorldCupDataProvider dataProvider;

    @Value("${app.mock.data-mode:NONE}")
    private String dataModeRaw;

    public MockDataSeeder(
            UserRepository userRepository,
            EntryRepository entryRepository,
            GroupStagePickRepository groupStagePickRepository,
            ThirdPlacePickRepository thirdPlacePickRepository,
            KnockoutPickRepository knockoutPickRepository,
            SquadPickRepository squadPickRepository,
            PlayerMatchStatsRepository playerMatchStatsRepository,
            PasswordEncoder passwordEncoder,
            WorldCupDataProvider dataProvider) {
        this.userRepository = userRepository;
        this.entryRepository = entryRepository;
        this.groupStagePickRepository = groupStagePickRepository;
        this.thirdPlacePickRepository = thirdPlacePickRepository;
        this.knockoutPickRepository = knockoutPickRepository;
        this.squadPickRepository = squadPickRepository;
        this.playerMatchStatsRepository = playerMatchStatsRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataProvider = dataProvider;
    }

    @Override
    public void run(String... args) {
        DataMode mode;
        try {
            mode = DataMode.valueOf(dataModeRaw.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown app.mock.data-mode '{}', defaulting to NONE", dataModeRaw);
            mode = DataMode.NONE;
        }

        if (mode == DataMode.NONE) {
            log.debug("MockDataSeeder: data-mode=NONE, skipping");
            return;
        }

        if (userRepository.findByEmail("user01@mock.wc26").isPresent()) {
            log.info("MockDataSeeder: mock data already present, skipping");
            return;
        }

        // Fetch live ESPN groups so group/third-place picks use real team IDs.
        List<GroupDto> groups = dataProvider.getGroups();
        if (groups.isEmpty()) {
            log.warn("MockDataSeeder: ESPN returned no groups — group and third-place picks will be skipped. " +
                     "Check connectivity or retry after the backend is fully started.");
        }

        // Fetch live ESPN athletes so squad picks use real athlete IDs that
        // the Squad UI can match against GET /api/teams/athletes.
        List<AthleteDto> allAthletes = dataProvider.getAllTeamAthletes();
        Map<String, List<String>> athleteIdsByPos = groupAthleteIdsByPosition(allAthletes);
        if (allAthletes.isEmpty()) {
            log.warn("MockDataSeeder: ESPN returned no athletes — squad picks will be skipped. " +
                     "Check connectivity or retry after the backend is fully started.");
        }

        log.info("MockDataSeeder: seeding {} mock data ({} groups, {} athletes from ESPN)...",
                mode, groups.size(), allAthletes.size());

        for (int i = 0; i < USER_PLAN.length; i++) {
            Object[] plan = USER_PLAN[i];
            String name = (String) plan[0];
            int entryCount = (int) plan[1];
            int squadOffset = (int) plan[2];
            int profile = (int) plan[3];

            String email = String.format("user%02d@mock.wc26", i + 1);
            User user = createUser(email, "password", name + " Mock", Role.USER);

            for (int e = 1; e <= entryCount; e++) {
                int squadIdx = (squadOffset + e - 1) % SQUAD_FORMATIONS.length;
                String entryName = entryCount == 1 ? name + "'s Entry" : name + " Entry " + e;
                Entry entry = createEntry(user, e, entryName, SQUAD_FORMATIONS[squadIdx]);

                if (!groups.isEmpty()) {
                    seedGroupPicks(entry, profile, groups);
                    seedThirdPlacePicks(entry, profile, groups);
                }
                if (!allAthletes.isEmpty()) {
                    seedSquadPicks(entry, squadIdx, athleteIdsByPos);
                }

                if (mode == DataMode.FULL) {
                    seedKnockoutPicks(entry, profile);
                }
            }
        }

        if (mode == DataMode.FULL) {
            seedPlayerMatchStats(athleteIdsByPos);
        }

        log.info("MockDataSeeder: done (mode={}, users={}, entries={})",
                mode, USER_PLAN.length, totalEntries());
    }

    // ── Pick seeders ──────────────────────────────────────────────────────────

    /**
     * Seeds group-stage 1st/2nd picks using real ESPN group IDs and team IDs.
     * Teams are taken from ESPN's listing order within each group:
     *   SHARP   — team[0] first, team[1] second (ESPN draw order)
     *   AVERAGE — correct for groups 0-5, swapped for groups 6-11
     *   WILD    — all swapped (team[1] first, team[0] second)
     */
    private void seedGroupPicks(Entry entry, int profile, List<GroupDto> groups) {
        for (int g = 0; g < groups.size(); g++) {
            GroupDto group = groups.get(g);
            List<TeamDto> teams = group.teams();
            if (teams.size() < 2) continue;

            String first, second;
            if (profile == 0) {
                first = teams.get(0).id(); second = teams.get(1).id();
            } else if (profile == 1) {
                if (g < 6) { first = teams.get(0).id(); second = teams.get(1).id(); }
                else       { first = teams.get(1).id(); second = teams.get(0).id(); }
            } else {
                first = teams.get(1).id(); second = teams.get(0).id();
            }

            GroupStagePick pick = new GroupStagePick();
            pick.setEntry(entry);
            pick.setGroupId(group.id());
            pick.setFirstPlaceTeamId(first);
            pick.setSecondPlaceTeamId(second);
            groupStagePickRepository.save(pick);
        }
    }

    /**
     * Seeds third-place picks for the first 8 groups using real ESPN team IDs.
     * The "correct" pick is the 3rd team in ESPN's draw order; the "wrong" pick
     * uses the 4th team (or the 2nd if the group only has 3 listed).
     *
     * Uniqueness: each entry gets at most one pick per group, and each team ID
     * appears at most once per entry (enforced by the DB unique constraint).
     * The AVERAGE profile picks correctly for slots 0-3 and uses the alternate
     * for slots 4-7 — both halves rotate within themselves so no team repeats.
     */
    private void seedThirdPlacePicks(Entry entry, int profile, List<GroupDto> groups) {
        int slots = Math.min(8, groups.size());
        for (int slot = 0; slot < slots; slot++) {
            GroupDto group = groups.get(slot);
            List<TeamDto> teams = group.teams();
            if (teams.size() < 3) continue;

            // "correct" = 3rd in ESPN order; "alternate" = 4th (or 2nd if <4 teams)
            String correct   = teams.get(2).id();
            String alternate = teams.size() > 3 ? teams.get(3).id() : teams.get(1).id();

            String teamId;
            if (profile == 0) {
                teamId = correct;
            } else if (profile == 1) {
                // slots 0-3 correct; slots 4-7 use alternate
                teamId = (slot < 4) ? correct : alternate;
            } else {
                teamId = alternate;
            }

            ThirdPlacePick pick = new ThirdPlacePick();
            pick.setEntry(entry);
            pick.setGroupId(group.id());
            pick.setTeamId(teamId);
            thirdPlacePickRepository.save(pick);
        }
    }

    /**
     * Seeds knockout picks using the BRACKET table.
     * matchEventId uses the R32-0…FINAL-0 format that BracketPage expects.
     * winnerTeamId uses the frontend mock integer team IDs that BRACKET_TEAM_LOOKUP
     * in bracket.js can resolve to full team objects.
     *
     * SHARP   — all picks correct (match[1])
     * AVERAGE — correct through R16, loser picked from QF onwards (match[2])
     * WILD    — only R32 correct; wrong from R16 onwards
     */
    private void seedKnockoutPicks(Entry entry, int profile) {
        for (String[] match : BRACKET) {
            String matchId   = match[0];
            String correct   = match[1];
            String alternate = match[2];

            String pickedWinner;
            if (profile == 0) {
                pickedWinner = correct;
            } else if (profile == 1) {
                pickedWinner = R32_EVENT_IDS.contains(matchId) || R16_EVENT_IDS.contains(matchId)
                        ? correct : alternate;
            } else {
                pickedWinner = R32_EVENT_IDS.contains(matchId) ? correct : alternate;
            }

            KnockoutPick pick = new KnockoutPick();
            pick.setEntry(entry);
            pick.setMatchEventId(matchId);
            pick.setWinnerTeamId(pickedWinner);
            knockoutPickRepository.save(pick);
        }
    }

    /**
     * Seeds squad picks using real ESPN athlete IDs fetched at startup.
     * Each template uses pre-computed offsets into the position lists so that
     * different templates pick different athletes.
     */
    private void seedSquadPicks(Entry entry, int squadIdx, Map<String, List<String>> byPos) {
        String formation = SQUAD_FORMATIONS[squadIdx];
        String[] parts = formation.split("-");
        int def = Integer.parseInt(parts[0]);
        int mid = Integer.parseInt(parts[1]);
        int fwd = Integer.parseInt(parts[2]);

        Set<String> usedIds = new HashSet<>();
        pickAthletes(entry, byPos.getOrDefault("GK",  Collections.emptyList()), GK_OFFSETS[squadIdx],  1,   "GK",  usedIds);
        pickAthletes(entry, byPos.getOrDefault("DEF", Collections.emptyList()), DEF_OFFSETS[squadIdx], def, "DEF", usedIds);
        pickAthletes(entry, byPos.getOrDefault("MID", Collections.emptyList()), MID_OFFSETS[squadIdx], mid, "MID", usedIds);
        pickAthletes(entry, byPos.getOrDefault("FWD", Collections.emptyList()), FWD_OFFSETS[squadIdx], fwd, "FWD", usedIds);
    }

    private void pickAthletes(Entry entry, List<String> ids, int offset, int count,
                               String position, Set<String> usedIds) {
        int picked = 0;
        for (int attempt = 0; attempt < ids.size() && picked < count; attempt++) {
            String id = ids.get((offset + attempt) % ids.size());
            if (usedIds.add(id)) {
                SquadPick pick = new SquadPick();
                pick.setEntry(entry);
                pick.setAthleteId(id);
                pick.setPosition(position);
                squadPickRepository.save(pick);
                picked++;
            }
        }
        if (picked < count) {
            log.warn("MockDataSeeder: only picked {}/{} {} — insufficient ESPN athletes", picked, count, position);
        }
    }

    // ── Player match stats ────────────────────────────────────────────────────
    // Uses real ESPN athlete IDs (same ones seeded in squad picks for templates
    // 0 and 1) so PlayerMatchStats rows join correctly with SquadPick rows.

    private void seedPlayerMatchStats(Map<String, List<String>> byPos) {
        List<String> gks  = byPos.getOrDefault("GK",  Collections.emptyList());
        List<String> defs = byPos.getOrDefault("DEF", Collections.emptyList());
        List<String> mids = byPos.getOrDefault("MID", Collections.emptyList());
        List<String> fwds = byPos.getOrDefault("FWD", Collections.emptyList());

        // GKs[0..2] — overlap with squad templates 0, 1, 2
        saveStats(at(gks,0), "GK",  "mock-evt-1", 90, 0, 0, true,  0, 0, 4);
        saveStats(at(gks,0), "GK",  "mock-evt-2", 90, 0, 0, false, 0, 0, 6);
        saveStats(at(gks,0), "GK",  "mock-evt-3", 90, 0, 0, true,  1, 0, 2);
        saveStats(at(gks,1), "GK",  "mock-evt-1", 90, 0, 0, true,  0, 0, 3);
        saveStats(at(gks,1), "GK",  "mock-evt-2", 45, 0, 0, false, 0, 0, 0);
        saveStats(at(gks,2), "GK",  "mock-evt-3", 90, 0, 0, false, 0, 0, 5);
        // DEFs[0..5] — overlap with squad templates 0 and 1
        saveStats(at(defs,0), "DEF", "mock-evt-1", 90, 1, 0, true,  0, 0, 0);
        saveStats(at(defs,0), "DEF", "mock-evt-2", 90, 0, 1, false, 0, 0, 0);
        saveStats(at(defs,0), "DEF", "mock-evt-3", 90, 1, 1, false, 1, 0, 0);
        saveStats(at(defs,1), "DEF", "mock-evt-1", 90, 0, 0, true,  0, 0, 0);
        saveStats(at(defs,1), "DEF", "mock-evt-2", 90, 1, 0, false, 0, 0, 0);
        saveStats(at(defs,2), "DEF", "mock-evt-3", 90, 0, 1, true,  0, 0, 0);
        saveStats(at(defs,3), "DEF", "mock-evt-1", 60, 0, 0, true,  0, 0, 0);
        saveStats(at(defs,4), "DEF", "mock-evt-2", 90, 0, 0, false, 1, 0, 0);
        saveStats(at(defs,5), "DEF", "mock-evt-3", 90, 0, 0, true,  0, 0, 0);
        // MIDs[0..5] — overlap with squad templates 0 and 1
        saveStats(at(mids,0), "MID", "mock-evt-1", 90, 1, 1, false, 0, 0, 0);
        saveStats(at(mids,0), "MID", "mock-evt-2", 90, 2, 0, false, 0, 0, 0);
        saveStats(at(mids,0), "MID", "mock-evt-3", 90, 0, 2, true,  0, 0, 0);
        saveStats(at(mids,1), "MID", "mock-evt-1", 90, 1, 0, false, 1, 0, 0);
        saveStats(at(mids,1), "MID", "mock-evt-2", 90, 0, 2, false, 0, 0, 0);
        saveStats(at(mids,2), "MID", "mock-evt-3", 90, 1, 1, true,  0, 0, 0);
        saveStats(at(mids,3), "MID", "mock-evt-1", 45, 0, 0, false, 0, 0, 0);
        saveStats(at(mids,4), "MID", "mock-evt-2", 90, 0, 1, false, 0, 0, 0);
        saveStats(at(mids,5), "MID", "mock-evt-3", 90, 1, 0, false, 0, 1, 0);
        // FWDs[0..4] — overlap with squad templates 0, 1, 2
        saveStats(at(fwds,0), "FWD", "mock-evt-1", 90, 2, 0, false, 0, 0, 0);
        saveStats(at(fwds,0), "FWD", "mock-evt-2", 90, 1, 1, false, 1, 0, 0);
        saveStats(at(fwds,0), "FWD", "mock-evt-3", 90, 1, 0, false, 0, 0, 0);
        saveStats(at(fwds,1), "FWD", "mock-evt-1", 90, 0, 2, false, 0, 0, 0);
        saveStats(at(fwds,1), "FWD", "mock-evt-2", 90, 1, 0, false, 0, 0, 0);
        saveStats(at(fwds,2), "FWD", "mock-evt-3", 60, 1, 1, false, 0, 0, 0);
        saveStats(at(fwds,3), "FWD", "mock-evt-1", 90, 0, 0, false, 1, 0, 0);
        saveStats(at(fwds,4), "FWD", "mock-evt-2", 90, 1, 1, false, 0, 0, 0);
    }

    /** Returns ids.get(i) if i is in bounds, otherwise a fallback string. */
    private static String at(List<String> ids, int i) {
        return i < ids.size() ? ids.get(i) : "unknown-" + i;
    }

    private void saveStats(String athleteId, String position, String eventId,
                           int minutes, int goals, int assists, boolean cleanSheet,
                           int yellowCards, int redCards, int saves) {
        PlayerMatchStats s = new PlayerMatchStats();
        s.setAthleteId(athleteId);
        s.setEventId(eventId + "-" + athleteId);
        s.setPosition(position);
        s.setMinutes(minutes);
        s.setGoals(goals);
        s.setAssists(assists);
        s.setCleanSheet(cleanSheet);
        s.setYellowCards(yellowCards);
        s.setRedCards(redCards);
        s.setSaves(saves);
        s.setTotalPoints(calcPoints(s));
        playerMatchStatsRepository.save(s);
    }

    private int calcPoints(PlayerMatchStats s) {
        int pts = 0;
        String pos = s.getPosition();
        if (s.getMinutes() >= 60)     pts += 2;
        else if (s.getMinutes() > 0)  pts += 1;
        int goalPts = switch (pos) {
            case "GK", "DEF" -> 6;
            case "MID"       -> 5;
            default          -> 4;
        };
        pts += s.getGoals() * goalPts;
        pts += s.getAssists() * 3;
        if (s.isCleanSheet() && s.getMinutes() >= 60) {
            pts += switch (pos) {
                case "GK", "DEF" -> 4;
                case "MID"       -> 1;
                default          -> 0;
            };
        }
        pts += s.getYellowCards() * -1;
        pts += s.getRedCards() * -3;
        if ("GK".equals(pos)) pts += (s.getSaves() / 3);
        return pts;
    }

    // ── Athlete helpers ───────────────────────────────────────────────────────

    /**
     * Groups ESPN athlete IDs by mapped position code (GK/DEF/MID/FWD).
     * Uses the same mapping as the frontend's normalizeAthlete function.
     */
    private static Map<String, List<String>> groupAthleteIdsByPosition(List<AthleteDto> athletes) {
        Map<String, List<String>> map = new LinkedHashMap<>();
        map.put("GK",  new ArrayList<>());
        map.put("DEF", new ArrayList<>());
        map.put("MID", new ArrayList<>());
        map.put("FWD", new ArrayList<>());
        for (AthleteDto a : athletes) {
            if (a.id() == null || a.id().isBlank()) continue;
            map.get(mapPosition(a.position())).add(a.id());
        }
        return map;
    }

    private static String mapPosition(String espnPosition) {
        return switch (espnPosition) {
            case "Goalkeeper"           -> "GK";
            case "Defender"             -> "DEF";
            case "Midfielder"           -> "MID";
            case "Attacker", "Forward"  -> "FWD";
            default                     -> "MID";
        };
    }

    // ── Entity helpers ────────────────────────────────────────────────────────

    private User createUser(String email, String rawPassword, String displayName, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setDisplayName(displayName);
        user.setRole(role);
        return userRepository.save(user);
    }

    private Entry createEntry(User user, int entryNumber, String name, String formation) {
        Entry entry = new Entry();
        entry.setUser(user);
        entry.setEntryNumber(entryNumber);
        entry.setName(name);
        entry.setFormation(formation);
        return entryRepository.save(entry);
    }

    private int totalEntries() {
        int total = 0;
        for (Object[] plan : USER_PLAN) total += (int) plan[1];
        return total;
    }

    public enum DataMode { NONE, GROUP_STAGE, FULL }
}
