package com.jominsky.worldcupapp.repository;

import com.jominsky.worldcupapp.model.Entry;
import com.jominsky.worldcupapp.model.SquadPick;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SquadPickRepository extends JpaRepository<SquadPick, UUID> {
    List<SquadPick> findByEntry(Entry entry);
    void deleteByEntry(Entry entry);
}
