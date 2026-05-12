package com.jominsky.worldcupapp.repository;

import com.jominsky.worldcupapp.model.Entry;
import com.jominsky.worldcupapp.model.ThirdPlacePick;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ThirdPlacePickRepository extends JpaRepository<ThirdPlacePick, UUID> {
    List<ThirdPlacePick> findByEntry(Entry entry);
    void deleteByEntry(Entry entry);
}
