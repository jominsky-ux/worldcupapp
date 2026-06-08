package com.jominsky.worldcupapp.service;

import com.jominsky.worldcupapp.dto.TournamentStatusDto;
import com.jominsky.worldcupapp.model.NotificationLog;
import com.jominsky.worldcupapp.model.User;
import com.jominsky.worldcupapp.provider.WorldCupDataProvider;
import com.jominsky.worldcupapp.repository.NotificationLogRepository;
import com.jominsky.worldcupapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Component
public class BracketReminderNotifier {

    private static final Logger log = LoggerFactory.getLogger(BracketReminderNotifier.class);
    private static final String NOTIFICATION_TYPE = "BRACKET_REMINDER";
    private static final DateTimeFormatter DEADLINE_FORMAT =
            DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a 'UTC'", Locale.ENGLISH)
                             .withZone(ZoneOffset.UTC);

    private final WorldCupDataProvider dataProvider;
    private final NotificationLogRepository notificationLogRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public BracketReminderNotifier(
            WorldCupDataProvider dataProvider,
            NotificationLogRepository notificationLogRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.dataProvider = dataProvider;
        this.notificationLogRepository = notificationLogRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // Runs 1 minute after startup, then every 5 minutes.
    // ESPN tournament status is already Caffeine-cached for 5 minutes so this
    // adds no extra outbound API calls.
    @Scheduled(initialDelay = 60_000, fixedDelay = 300_000)
    public void checkAndSendBracketReminder() {
        if (notificationLogRepository.existsByNotificationType(NOTIFICATION_TYPE)) {
            return;
        }

        TournamentStatusDto status;
        try {
            status = dataProvider.getTournamentStatus();
        } catch (Exception e) {
            log.warn("BracketReminderNotifier: could not fetch tournament status – {}", e.getMessage());
            return;
        }

        // Fire when the group stage is over AND the knockout bracket window is open.
        if (status.groupPicksOpen() || !status.bracketPicksOpen()) {
            return;
        }

        String deadline = formatDeadline(status.roundOf32FirstGameTime());
        List<User> users = userRepository.findAll();

        log.info("Sending bracket reminder to {} users (deadline: {})", users.size(), deadline);
        for (User user : users) {
            emailService.sendBracketReminder(user, deadline);
        }

        NotificationLog record = new NotificationLog();
        record.setNotificationType(NOTIFICATION_TYPE);
        record.setRecipientCount(users.size());
        notificationLogRepository.save(record);

        log.info("Bracket reminder sent to {} users", users.size());
    }

    private String formatDeadline(String iso8601) {
        if (iso8601 == null || iso8601.isBlank()) {
            return "before the Round of 32 begins";
        }
        try {
            return DEADLINE_FORMAT.format(Instant.parse(iso8601));
        } catch (Exception e) {
            return iso8601;
        }
    }
}
