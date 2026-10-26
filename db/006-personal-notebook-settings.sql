SET LOCAL search_path TO library4, public;
CREATE TABLE notebook_personal (
    notebook_id UUID NOT NULL REFERENCES shared_notebooks(notebook_id),
    user_id UUID NOT NULL REFERENCES users(id),
    envelope JSONB NOT NULL,
    PRIMARY KEY (notebook_id,user_id)
);
