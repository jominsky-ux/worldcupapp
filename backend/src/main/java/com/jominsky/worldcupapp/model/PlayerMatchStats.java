package com.jominsky.worldcupapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "player_match_stats", uniqueConstraints =
        @UniqueConstraint(name = "uq_athlete_event", columnNames = {"athlete_id", "event_id"}))
public class PlayerMatchStats {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String athleteId;

    @Column(nullable = false)
    private String eventId;

    @Column(nullable = false, length = 3)
    private String position;

    private int minutes;
    private int goals;
    private int assists;
    private boolean cleanSheet;
    private int yellowCards;
    private int redCards;
    private int saves;
    private int totalPoints;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    private void prePersist() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public String getAthleteId() { return athleteId; }
    public void setAthleteId(String athleteId) { this.athleteId = athleteId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public int getMinutes() { return minutes; }
    public void setMinutes(int minutes) { this.minutes = minutes; }
    public int getGoals() { return goals; }
    public void setGoals(int goals) { this.goals = goals; }
    public int getAssists() { return assists; }
    public void setAssists(int assists) { this.assists = assists; }
    public boolean isCleanSheet() { return cleanSheet; }
    public void setCleanSheet(boolean cleanSheet) { this.cleanSheet = cleanSheet; }
    public int getYellowCards() { return yellowCards; }
    public void setYellowCards(int yellowCards) { this.yellowCards = yellowCards; }
    public int getRedCards() { return redCards; }
    public void setRedCards(int redCards) { this.redCards = redCards; }
    public int getSaves() { return saves; }
    public void setSaves(int saves) { this.saves = saves; }
    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }
    public Instant getCreatedAt() { return createdAt; }
}
