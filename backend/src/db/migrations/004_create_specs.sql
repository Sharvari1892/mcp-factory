CREATE TABLE specs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    spec_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);