-- Add formation to entries (nullable; set when user saves their squad)
-- Only the eight supported formations are allowed.
ALTER TABLE entries
    ADD COLUMN formation VARCHAR(10) NOT NULL
        CHECK (formation IN ('3-5-2', '3-4-3', '4-5-1', '4-4-2', '4-3-3', '5-4-1', '5-3-2', '5-2-3'));

-- One row per player in the starting XI, keyed to an entry.
-- position values: GK (1), DEF, MID, FWD — counts must match the formation.
CREATE TABLE squad_picks (
    id           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_id     UUID         NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    position     VARCHAR(3)   NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
    athlete_id   VARCHAR(50)  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- no duplicate athletes within the same entry
    CONSTRAINT uq_entry_athlete UNIQUE (entry_id, athlete_id)
);

CREATE INDEX idx_squad_picks_entry_id ON squad_picks (entry_id);
