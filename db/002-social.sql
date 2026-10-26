SET LOCAL search_path TO library4, public;

CREATE TABLE social_posts (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 12000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX social_posts_recent ON social_posts(created_at DESC, id DESC);

CREATE TABLE friendships (
    first_id UUID NOT NULL REFERENCES users(id),
    second_id UUID NOT NULL REFERENCES users(id),
    requester_id UUID NOT NULL REFERENCES users(id),
    accepted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (first_id, second_id),
    CHECK (first_id < second_id),
    CHECK (requester_id IN (first_id, second_id))
);
CREATE INDEX friendships_second ON friendships(second_id);

CREATE TABLE social_blocks (
    owner_id UUID NOT NULL REFERENCES users(id),
    blocked_id UUID NOT NULL REFERENCES users(id),
    PRIMARY KEY (owner_id, blocked_id),
    CHECK (owner_id <> blocked_id)
);

CREATE TABLE social_messages (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (sender_id <> recipient_id)
);
CREATE INDEX social_messages_pair ON social_messages(
    LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC, id DESC
);
