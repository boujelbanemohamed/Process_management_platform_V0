-- Add manager_id to entities table
ALTER TABLE entities
ADD COLUMN manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL;