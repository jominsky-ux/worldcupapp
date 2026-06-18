ALTER TABLE player_match_stats
    ADD COLUMN opponent_team_id VARCHAR(50),
    ADD COLUMN match_date TIMESTAMPTZ;
