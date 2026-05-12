CREATE TABLE entries (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_number SMALLINT    NOT NULL CHECK (entry_number BETWEEN 1 AND 3),
    name         VARCHAR(50),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_entry_number UNIQUE (user_id, entry_number)
);

CREATE INDEX idx_entries_user_id ON entries (user_id);
