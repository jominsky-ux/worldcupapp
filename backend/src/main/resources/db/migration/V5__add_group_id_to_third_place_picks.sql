-- Third-place picks without a group context are invalid under the new rule;
-- truncate before adding the NOT NULL column.
TRUNCATE TABLE third_place_picks;

ALTER TABLE third_place_picks
    ADD COLUMN group_id VARCHAR(5) NOT NULL;

-- Prevent two picks from the same group within one entry.
ALTER TABLE third_place_picks
    ADD CONSTRAINT uq_entry_third_place_group UNIQUE (entry_id, group_id);
