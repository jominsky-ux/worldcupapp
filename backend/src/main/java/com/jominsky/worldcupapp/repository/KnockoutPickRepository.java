package com.jominsky.worldcupapp.repository;

import com.jominsky.worldcupapp.model.Entry;
import com.jominsky.worldcupapp.model.KnockoutPick;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnockoutPickRepository extends JpaRepository<KnockoutPick, UUID> {
    List<KnockoutPick> findByEntry(Entry entry);
    Optional<KnockoutPick> findByEntryAndMatchEventId(Entry entry, String matchEventId);
}
