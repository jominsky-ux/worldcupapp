CREATE TABLE player_match_stats (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    VARCHAR(50)  NOT NULL,
  event_id      VARCHAR(50)  NOT NULL,
  position      VARCHAR(3)   NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  minutes       INT          NOT NULL DEFAULT 0,
  goals         INT          NOT NULL DEFAULT 0,
  assists       INT          NOT NULL DEFAULT 0,
  clean_sheet   BOOLEAN      NOT NULL DEFAULT FALSE,
  yellow_cards  INT          NOT NULL DEFAULT 0,
  red_cards     INT          NOT NULL DEFAULT 0,
  saves         INT          NOT NULL DEFAULT 0,
  total_points  INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_athlete_event UNIQUE (athlete_id, event_id)
);

CREATE INDEX idx_pms_athlete_id ON player_match_stats (athlete_id);
CREATE INDEX idx_pms_event_id   ON player_match_stats (event_id);
