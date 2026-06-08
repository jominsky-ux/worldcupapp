package com.jominsky.worldcupapp.repository;

import com.jominsky.worldcupapp.model.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {
    boolean existsByNotificationType(String notificationType);
}
