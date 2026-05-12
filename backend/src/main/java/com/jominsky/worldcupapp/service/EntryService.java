package com.jominsky.worldcupapp.service;

import com.jominsky.worldcupapp.dto.EntryRequest;
import com.jominsky.worldcupapp.dto.EntryResponse;
import com.jominsky.worldcupapp.model.Entry;
import com.jominsky.worldcupapp.model.User;
import com.jominsky.worldcupapp.repository.EntryRepository;
import com.jominsky.worldcupapp.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class EntryService {

    private static final int MAX_ENTRIES_PER_USER = 3;

    private final EntryRepository entryRepository;
    private final UserRepository userRepository;

    public EntryService(EntryRepository entryRepository, UserRepository userRepository) {
        this.entryRepository = entryRepository;
        this.userRepository = userRepository;
    }

    public List<EntryResponse> getEntries(String email) {
        User user = loadUser(email);
        return entryRepository.findByUserOrderByEntryNumber(user).stream()
                .map(this::toResponse)
                .toList();
    }

    public EntryResponse createEntry(String email, EntryRequest request) {
        User user = loadUser(email);
        long existing = entryRepository.countByUser(user);
        if (existing >= MAX_ENTRIES_PER_USER) {
            throw new IllegalStateException("Maximum of " + MAX_ENTRIES_PER_USER + " entries per user.");
        }
        Entry entry = new Entry();
        entry.setUser(user);
        entry.setEntryNumber((int) existing + 1);
        entry.setName(request.name());
        return toResponse(entryRepository.save(entry));
    }

    public Entry loadAndVerifyOwnership(UUID entryId, String email) {
        Entry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found: " + entryId));
        if (!entry.getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("Entry does not belong to the authenticated user.");
        }
        return entry;
    }

    private User loadUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public EntryResponse toResponse(Entry entry) {
        return new EntryResponse(entry.getId(), entry.getEntryNumber(),
                entry.getName(), entry.getCreatedAt());
    }
}
