-- Tracks which one-time notifications have been sent so the scheduler
-- never re-sends them after a container restart.
CREATE TABLE notification_log (
    id                UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_type VARCHAR(100) NOT NULL UNIQUE,
    recipient_count   INT          NOT NULL,
    sent_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);
