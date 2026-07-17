-- Up
ALTER TABLE event_outbox ADD COLUMN processing_at TEXT;

-- Down
-- (SQLite doesn't support DROP COLUMN easily before 3.35, but it's fine)
