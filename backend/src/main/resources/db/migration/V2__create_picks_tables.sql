-- Group-stage picks: one row per user per group storing their predicted 1st and 2nd place.
CREATE TABLE group_stage_picks (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    group_id             VARCHAR(5)  NOT NULL,   -- "A" through "L" for 2026 WC
    first_place_team_id  VARCHAR(50) NOT NULL,   -- ESPN team ID
    second_place_team_id VARCHAR(50) NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_group_stage_pick UNIQUE (user_id, group_id)
);

CREATE INDEX idx_group_stage_picks_user_id ON group_stage_picks (user_id);

-- Third-place picks: each user nominates exactly 8 of the 12 third-place finishers to advance.
-- One row per (user, team) pair; uniqueness is enforced here and the count is enforced in the app.
CREATE TABLE third_place_picks (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    team_id    VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_third_place_pick UNIQUE (user_id, team_id)
);

CREATE INDEX idx_third_place_picks_user_id ON third_place_picks (user_id);

-- Knockout picks: one row per user per knockout match storing their predicted winner.
CREATE TABLE knockout_picks (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    match_event_id  VARCHAR(50) NOT NULL,   -- ESPN event ID
    winner_team_id  VARCHAR(50) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_knockout_pick UNIQUE (user_id, match_event_id)
);

CREATE INDEX idx_knockout_picks_user_id        ON knockout_picks (user_id);
CREATE INDEX idx_knockout_picks_match_event_id ON knockout_picks (match_event_id);
