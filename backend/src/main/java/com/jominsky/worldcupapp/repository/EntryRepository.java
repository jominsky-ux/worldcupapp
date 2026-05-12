package com.jominsky.worldcupapp.repository;

import com.jominsky.worldcupapp.model.Entry;
import com.jominsky.worldcupapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EntryRepository extends JpaRepository<Entry, UUID> {
    List<Entry> findByUserOrderByEntryNumber(User user);
    long countByUser(User user);
}
