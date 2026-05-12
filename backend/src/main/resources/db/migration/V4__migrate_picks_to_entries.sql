-- For any user who already has picks, create a default entry (entry_number = 1)
-- so the data migration below has an entry to point to.
INSERT INTO entries (user_id, entry_number)
SELECT DISTINCT user_id, 1
FROM (
    SELECT user_id FROM group_stage_picks
    UNION
    SELECT user_id FROM third_place_picks
    UNION
    SELECT user_id FROM knockout_picks
) existing_pickers
ON CONFLICT ON CONSTRAINT uq_user_entry_number DO NOTHING;

-- Add entry_id columns (nullable until backfilled)
ALTER TABLE group_stage_picks ADD COLUMN entry_id UUID REFERENCES entries (id) ON DELETE CASCADE;
ALTER TABLE third_place_picks ADD COLUMN entry_id UUID REFERENCES entries (id) ON DELETE CASCADE;
ALTER TABLE knockout_picks     ADD COLUMN entry_id UUID REFERENCES entries (id) ON DELETE CASCADE;

-- Backfill: point every existing pick at the entry_number=1 entry for that user
UPDATE group_stage_picks gsp
SET entry_id = e.id
FROM entries e
WHERE e.user_id = gsp.user_id AND e.entry_number = 1;

UPDATE third_place_picks tpp
SET entry_id = e.id
FROM entries e
WHERE e.user_id = tpp.user_id AND e.entry_number = 1;

UPDATE knockout_picks kp
SET entry_id = e.id
FROM entries e
WHERE e.user_id = kp.user_id AND e.entry_number = 1;

-- Now that every row has an entry_id, enforce NOT NULL
ALTER TABLE group_stage_picks ALTER COLUMN entry_id SET NOT NULL;
ALTER TABLE third_place_picks ALTER COLUMN entry_id SET NOT NULL;
ALTER TABLE knockout_picks     ALTER COLUMN entry_id SET NOT NULL;

-- Drop old user-scoped unique constraints and indexes
ALTER TABLE group_stage_picks DROP CONSTRAINT uq_group_stage_pick;
ALTER TABLE third_place_picks DROP CONSTRAINT uq_third_place_pick;
ALTER TABLE knockout_picks     DROP CONSTRAINT uq_knockout_pick;

DROP INDEX idx_group_stage_picks_user_id;
DROP INDEX idx_third_place_picks_user_id;
DROP INDEX idx_knockout_picks_user_id;

-- Drop user_id columns
ALTER TABLE group_stage_picks DROP COLUMN user_id;
ALTER TABLE third_place_picks DROP COLUMN user_id;
ALTER TABLE knockout_picks     DROP COLUMN user_id;

-- Add entry-scoped unique constraints
ALTER TABLE group_stage_picks ADD CONSTRAINT uq_entry_group         UNIQUE (entry_id, group_id);
ALTER TABLE third_place_picks ADD CONSTRAINT uq_entry_third_place   UNIQUE (entry_id, team_id);
ALTER TABLE knockout_picks     ADD CONSTRAINT uq_entry_knockout      UNIQUE (entry_id, match_event_id);

-- Add entry-scoped indexes
CREATE INDEX idx_group_stage_picks_entry_id ON group_stage_picks (entry_id);
CREATE INDEX idx_third_place_picks_entry_id ON third_place_picks (entry_id);
CREATE INDEX idx_knockout_picks_entry_id    ON knockout_picks     (entry_id);
