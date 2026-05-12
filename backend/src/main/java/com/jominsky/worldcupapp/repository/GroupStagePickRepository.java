package com.jominsky.worldcupapp.repository;

import com.jominsky.worldcupapp.model.Entry;
import com.jominsky.worldcupapp.model.GroupStagePick;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupStagePickRepository extends JpaRepository<GroupStagePick, UUID> {
    List<GroupStagePick> findByEntry(Entry entry);
    Optional<GroupStagePick> findByEntryAndGroupId(Entry entry, String groupId);
}
