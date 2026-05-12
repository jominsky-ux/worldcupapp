package com.jominsky.worldcupapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "third_place_picks", uniqueConstraints = {
        @UniqueConstraint(name = "uq_entry_third_place",       columnNames = {"entry_id", "team_id"}),
        @UniqueConstraint(name = "uq_entry_third_place_group", columnNames = {"entry_id", "group_id"})
})
public class ThirdPlacePick {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private Entry entry;

    @Column(nullable = false, length = 5)
    private String groupId;

    @Column(nullable = false, length = 50)
    private String teamId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    private void prePersist() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public Entry getEntry() { return entry; }
    public void setEntry(Entry entry) { this.entry = entry; }
    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public Instant getCreatedAt() { return createdAt; }
}
