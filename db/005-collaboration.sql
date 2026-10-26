SET LOCAL search_path TO library4, public;

CREATE TABLE sharing_keys (
    owner_id UUID PRIMARY KEY REFERENCES users(id),
    public_key JSONB NOT NULL,
    private_envelope JSONB NOT NULL
);
CREATE TABLE shared_notebooks (
    notebook_id UUID PRIMARY KEY REFERENCES notebooks(id),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
    public_key TEXT,
    public_title TEXT,
    snapshot JSONB NOT NULL,
    snapshot_seq BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((visibility = 'public') = (public_key IS NOT NULL AND public_title IS NOT NULL))
);
CREATE TABLE notebook_access (
    notebook_id UUID NOT NULL REFERENCES shared_notebooks(notebook_id),
    user_id UUID NOT NULL REFERENCES users(id),
    role TEXT NOT NULL CHECK (role IN ('editor','reader','blocked')),
    key_envelope JSONB,
    PRIMARY KEY (notebook_id,user_id),
    CHECK (role = 'blocked' OR key_envelope IS NOT NULL)
);
CREATE INDEX notebook_access_user ON notebook_access(user_id);
CREATE TABLE collaboration_updates (
    seq BIGSERIAL PRIMARY KEY,
    id UUID NOT NULL UNIQUE,
    notebook_id UUID NOT NULL REFERENCES shared_notebooks(notebook_id),
    sender_id UUID NOT NULL REFERENCES users(id),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX collaboration_updates_book ON collaboration_updates(notebook_id,seq);
CREATE TABLE collaboration_snapshots (
    id BIGSERIAL PRIMARY KEY,
    notebook_id UUID NOT NULL REFERENCES shared_notebooks(notebook_id),
    payload JSONB NOT NULL,
    through_seq BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX collaboration_snapshots_book ON collaboration_snapshots(notebook_id,id DESC);
