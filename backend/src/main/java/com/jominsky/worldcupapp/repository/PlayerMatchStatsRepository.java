package com.jominsky.worldcupapp.repository;

import com.jominsky.worldcupapp.model.PlayerMatchStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlayerMatchStatsRepository extends JpaRepository<PlayerMatchStats, UUID> {

    boolean existsByEventId(String eventId);

    boolean existsByEventIdAndOpponentTeamIdIsNull(String eventId);

    java.util.Optional<PlayerMatchStats> findByAthleteIdAndEventId(String athleteId, String eventId);

    List<PlayerMatchStats> findByAthleteIdOrderByMatchDateDesc(String athleteId);

    @Query("SELECT p.athleteId, SUM(p.totalPoints) FROM PlayerMatchStats p GROUP BY p.athleteId")
    List<Object[]> sumPointsByAthlete();

    @Query("SELECT p.athleteId, COUNT(p) FROM PlayerMatchStats p GROUP BY p.athleteId")
    List<Object[]> countMatchesByAthlete();
}
