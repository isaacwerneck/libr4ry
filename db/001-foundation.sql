CREATE SCHEMA IF NOT EXISTS library4;
SET LOCAL search_path TO library4, public;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_owner ON sessions(owner_id);

CREATE TABLE user_keysets (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL UNIQUE REFERENCES users(id),
    root_envelope JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (id, owner_id)
);

CREATE TABLE notebooks (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id),
    keyset_id UUID NOT NULL,
    wrapped_key JSONB NOT NULL,
    encrypted_metadata JSONB NOT NULL,
    revision BIGINT NOT NULL CHECK (revision > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (keyset_id, owner_id) REFERENCES user_keysets(id, owner_id)
);
CREATE INDEX notebooks_owner_updated ON notebooks(owner_id, updated_at DESC);

CREATE TABLE pages (
    id UUID PRIMARY KEY,
    notebook_id UUID NOT NULL REFERENCES notebooks(id),
    position INTEGER NOT NULL CHECK (position >= 0),
    current_revision BIGINT NOT NULL CHECK (current_revision > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (notebook_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE page_versions (
    page_id UUID NOT NULL REFERENCES pages(id),
    revision BIGINT NOT NULL CHECK (revision > 0),
    encrypted_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (page_id, revision)
);
ALTER TABLE pages ADD CONSTRAINT pages_current_version
    FOREIGN KEY (id, current_revision) REFERENCES page_versions(page_id, revision)
    DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    notebook_id UUID NOT NULL REFERENCES notebooks(id),
    position INTEGER NOT NULL CHECK (position >= 0),
    revision BIGINT NOT NULL CHECK (revision > 0),
    encrypted_payload JSONB NOT NULL,
    UNIQUE (notebook_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE notebook_mutations (
    notebook_id UUID NOT NULL REFERENCES notebooks(id),
    mutation_id UUID NOT NULL,
    request_hash TEXT NOT NULL,
    accepted_revision BIGINT NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (notebook_id, mutation_id)
);
