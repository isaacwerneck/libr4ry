SET LOCAL search_path TO library4, public;

CREATE TABLE social_reports (
    id UUID PRIMARY KEY,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
    post_title TEXT NOT NULL,
    post_content TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('abuse', 'spam', 'privacy', 'other')),
    details TEXT NOT NULL CHECK (char_length(details) <= 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT CHECK (resolution IN ('dismiss', 'remove')),
    CHECK ((resolved_at IS NULL) = (resolution IS NULL)),
    UNIQUE (reporter_id, post_id)
);
CREATE INDEX social_reports_queue ON social_reports(created_at, id) WHERE resolved_at IS NULL;
CREATE INDEX social_reports_retention ON social_reports(resolved_at) WHERE resolved_at IS NOT NULL;
