package com.jominsky.worldcupapp.config;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.jominsky.worldcupapp.model.Entry;
import com.jominsky.worldcupapp.model.GroupStagePick;
import com.jominsky.worldcupapp.model.KnockoutPick;
import com.jominsky.worldcupapp.model.Role;
import com.jominsky.worldcupapp.model.SquadPick;
import com.jominsky.worldcupapp.model.ThirdPlacePick;
import com.jominsky.worldcupapp.model.User;
import com.jominsky.worldcupapp.repository.EntryRepository;
import com.jominsky.worldcupapp.repository.GroupStagePickRepository;
import com.jominsky.worldcupapp.repository.KnockoutPickRepository;
import com.jominsky.worldcupapp.repository.SquadPickRepository;
import com.jominsky.worldcupapp.repository.ThirdPlacePickRepository;
import com.jominsky.worldcupapp.repository.UserRepository;

/**
 * Seeds the in-memory H2 database with two test accounts, entries, and sample
 * picks
 * when the "local" Spring profile is active.
 *
 * Test credentials:
 * player1@test.com / password – 2 entries with picks seeded
 * player2@test.com / password – no entries (tests empty state in the UI)
 *
 * Team IDs are placeholder values matching ESPN's numeric format.
 * Replace them with real ESPN team IDs once confirmed via /api/groups or
 * /api/standings.
 */
@Component
@Profile("local")
@Order(1)
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    // Placeholder ESPN team IDs
    private static final String TEAM_USA = "660";
    private static final String TEAM_MEXICO = "203";
    private static final String TEAM_CANADA = "206";
    private static final String TEAM_BRAZIL = "205";
    private static final String TEAM_ARGENTINA = "202";
    private static final String TEAM_FRANCE = "478";
    private static final String TEAM_ENGLAND = "448";
    private static final String TEAM_GERMANY = "481";
    private static final String TEAM_SPAIN = "164";
    private static final String TEAM_PORTUGAL = "482";
    private static final String TEAM_NETHERLANDS = "449";
    private static final String TEAM_JAPAN = "627";
    private static final String TEAM_MOROCCO = "2869";
    private static final String TEAM_SENEGAL = "654";
    private static final String TEAM_COLOMBIA = "208";
    private static final String TEAM_AUSTRALIA = "628";
    private static final String TEAM_SCOTLAND = "580";
    private static final String TEAM_TURKEY = "465";
    private static final String TEAM_IVORY_COAST = "4789";
    private static final String TEAM_SWITZERLAND = "475";
    private static final String TEAM_SWEDEN = "466";
    private static final String TEAM_GHANA = "4469";
    private static final String TEAM_ECUADOR = "209";
    private static final String TEAM_QATAR = "4398";
    private static final String TEAM_SOUTH_KOREA = "451";
    private static final String TEAM_PARAGUAY = "210";
    private static final String TEAM_BELGIUM = "459";
    private static final String TEAM_EGYPT = "2620";
    private static final String TEAM_URUGUAY = "212";
    private static final String TEAM_NORWAY = "464";
    private static final String TEAM_ALGERIA = "624";
    private static final String TEAM_CZECHIA = "450";
    private static final String TEAM_IRAN = "469";
    private static final String TEAM_CROATIA = "477";
    private static final String TEAM_SAUDI_ARABIA = "655";

    private final UserRepository userRepository;
    private final EntryRepository entryRepository;
    private final GroupStagePickRepository groupStagePickRepository;
    private final ThirdPlacePickRepository thirdPlacePickRepository;
    private final KnockoutPickRepository knockoutPickRepository;
    private final SquadPickRepository squadPickRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            EntryRepository entryRepository,
            GroupStagePickRepository groupStagePickRepository,
            ThirdPlacePickRepository thirdPlacePickRepository,
            KnockoutPickRepository knockoutPickRepository,
            SquadPickRepository squadPickRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.entryRepository = entryRepository;
        this.groupStagePickRepository = groupStagePickRepository;
        this.thirdPlacePickRepository = thirdPlacePickRepository;
        this.knockoutPickRepository = knockoutPickRepository;
        this.squadPickRepository = squadPickRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("Seeding local test data...");

        User player1 = createUser("player1@test.com", "password", "Player One", Role.USER);
        User player2 = createUser("player2@test.com", "password", "Player Two", Role.USER);

        // Entry 1 for player1 – full set of picks
        Entry entry1 = createEntry(player1, 1, "My Main Entry", "3-4-3");
        seedGroupStagePicks(entry1,
                TEAM_MEXICO, TEAM_SOUTH_KOREA,
                TEAM_CANADA, TEAM_SWITZERLAND,
                TEAM_BRAZIL, TEAM_MOROCCO,
                TEAM_USA, TEAM_PARAGUAY,
                TEAM_ECUADOR, TEAM_GERMANY,
                TEAM_NETHERLANDS, TEAM_JAPAN,
                TEAM_BELGIUM, TEAM_EGYPT,
                TEAM_SPAIN, TEAM_URUGUAY,
                TEAM_FRANCE, TEAM_NORWAY,
                TEAM_ARGENTINA, TEAM_ALGERIA,
                TEAM_COLOMBIA, TEAM_PORTUGAL,
                TEAM_ENGLAND, TEAM_CROATIA);
        seedThirdPlacePicks(entry1, Map.of(
                "1", TEAM_CZECHIA,
                "2", TEAM_QATAR,
                "3", TEAM_SCOTLAND,
                "4", TEAM_TURKEY,
                "5", TEAM_IVORY_COAST,
                "6", TEAM_SWEDEN,
                "12", TEAM_GHANA,
                "9", TEAM_SENEGAL));
        seedKnockoutPicks(entry1);
        seedSquadPicks(entry1);

        // Entry 2 for player1 – different picks, no knockout picks yet
        Entry entry2 = createEntry(player1, 2, "Long Shot Entry", "4-3-3");
        seedGroupStagePicks(entry2,
                TEAM_SOUTH_KOREA, TEAM_CZECHIA,
                TEAM_SWITZERLAND, TEAM_QATAR,
                TEAM_MOROCCO, TEAM_BRAZIL,
                TEAM_USA, TEAM_TURKEY,
                TEAM_GERMANY, TEAM_ECUADOR,
                TEAM_SWEDEN, TEAM_NETHERLANDS,
                TEAM_EGYPT, TEAM_IRAN,
                TEAM_URUGUAY, TEAM_SPAIN,
                TEAM_FRANCE, TEAM_SENEGAL,
                TEAM_ALGERIA, TEAM_ARGENTINA,
                TEAM_PORTUGAL, TEAM_COLOMBIA,
                TEAM_CROATIA, TEAM_ENGLAND);
        seedThirdPlacePicks(entry2, Map.of(
                "1", TEAM_MEXICO,
                "2", TEAM_CANADA,
                "3", TEAM_SCOTLAND,
                "4", TEAM_AUSTRALIA,
                "5", TEAM_IVORY_COAST,
                "6", TEAM_JAPAN,
                "7", TEAM_BELGIUM,
                "8", TEAM_SAUDI_ARABIA));

        // player2 has no entries – useful for testing the blank state in the UI
        log.info("Seeded users: {} (2 entries) and {} (0 entries)", player1.getEmail(), player2.getEmail());
        log.info("Test credentials: player1@test.com / password  |  player2@test.com / password");
    }

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

    private void seedGroupStagePicks(Entry entry,
            String a1, String a2,
            String b1, String b2,
            String c1, String c2,
            String d1, String d2,
            String e1, String e2,
            String f1, String f2,
            String g1, String g2,
            String h1, String h2,
            String i1, String i2,
            String j1, String j2,
            String k1, String k2,
            String l1, String l2) {
        List.of(
                groupPick(entry, "1", a1, a2),
                groupPick(entry, "2", b1, b2),
                groupPick(entry, "3", c1, c2),
                groupPick(entry, "4", d1, d2),
                groupPick(entry, "5", e1, e2),
                groupPick(entry, "6", f1, f2),
                groupPick(entry, "7", g1, g2),
                groupPick(entry, "8", h1, h2),
                groupPick(entry, "9", i1, i2),
                groupPick(entry, "10", j1, j2),
                groupPick(entry, "11", k1, k2),
                groupPick(entry, "12", l1, l2)).forEach(groupStagePickRepository::save);
    }

    private void seedThirdPlacePicks(Entry entry, Map<String, String> groupToTeam) {
        groupToTeam.forEach((groupId, teamId) -> {
            ThirdPlacePick pick = new ThirdPlacePick();
            pick.setEntry(entry);
            pick.setGroupId(groupId);
            pick.setTeamId(teamId);
            thirdPlacePickRepository.save(pick);
        });
    }

    private void seedKnockoutPicks(Entry entry) {
        // Placeholder ESPN event IDs for knockout matches – update once the bracket is
        // set.
        // List.of(
        // knockoutPick(entry, "ko-r32-1", TEAM_USA),
        // knockoutPick(entry, "ko-r32-2", TEAM_BRAZIL),
        // knockoutPick(entry, "ko-r16-1", TEAM_FRANCE),
        // knockoutPick(entry, "ko-qf-1",
        // TEAM_ARGENTINA)).forEach(knockoutPickRepository::save);
    }

    private void seedSquadPicks(Entry entry) {
        List.of(
                squadPick(entry, "189026", "GK"),
                squadPick(entry, "259910", "DEF"),
                squadPick(entry, "233621", "DEF"),
                squadPick(entry, "240233", "DEF"),
                squadPick(entry, "291281", "MID"),
                squadPick(entry, "250465", "MID"),
                squadPick(entry, "124091", "MID"),
                squadPick(entry, "142200", "MID"),
                squadPick(entry, "362150", "FWD"),
                squadPick(entry, "231388", "FWD"),
                squadPick(entry, "303748", "FWD")).forEach(squadPickRepository::save);
    }

    private SquadPick squadPick(Entry entry, String athleteId, String position) {
        SquadPick pick = new SquadPick();
        pick.setEntry(entry);
        pick.setAthleteId(athleteId);
        pick.setPosition(position);
        return pick;
    }

    private GroupStagePick groupPick(Entry entry, String groupId,
            String firstTeamId, String secondTeamId) {
        GroupStagePick pick = new GroupStagePick();
        pick.setEntry(entry);
        pick.setGroupId(groupId);
        pick.setFirstPlaceTeamId(firstTeamId);
        pick.setSecondPlaceTeamId(secondTeamId);
        return pick;
    }

    private KnockoutPick knockoutPick(Entry entry, String matchEventId, String winnerTeamId) {
        KnockoutPick pick = new KnockoutPick();
        pick.setEntry(entry);
        pick.setMatchEventId(matchEventId);
        pick.setWinnerTeamId(winnerTeamId);
        return pick;
    }
}
