ALTER TABLE player_match_stats
    ADD COLUMN penalty_misses INT NOT NULL DEFAULT 0,
    ADD COLUMN penalty_saves  INT NOT NULL DEFAULT 0;

-- Reset opponent_team_id so the scheduler reprocesses all existing rows
-- and populates the new columns. The sync logic already handles this case:
-- rows with opponent_team_id IS NULL are always reprocessed.
UPDATE player_match_stats SET opponent_team_id = NULL;
