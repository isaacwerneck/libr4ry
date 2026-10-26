SET LOCAL search_path TO library4, public;

CREATE TABLE password_resets (
    token_hash TEXT PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 minutes',
    consumed_at TIMESTAMPTZ
);
CREATE INDEX password_resets_owner_created ON password_resets(owner_id, created_at DESC);
CREATE INDEX password_resets_created ON password_resets(created_at);
