-- Add permissions JSON column to user_roles table
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS permissions JSON NULL AFTER is_active;
