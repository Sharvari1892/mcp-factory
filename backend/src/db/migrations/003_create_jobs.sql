CREATE TABLE generation_jobs (
id UUID PRIMARY KEY,
server_id UUID NOT NULL REFERENCES mcp_servers(id),
status TEXT NOT NULL DEFAULT 'pending',
logs TEXT,
started_at TIMESTAMP,
finished_at TIMESTAMP,
created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
