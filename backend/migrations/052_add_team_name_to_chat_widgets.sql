-- Migration: Add team_name to chat_widgets table
-- Description: Add configurable team name for chat widget header

ALTER TABLE chat_widgets 
ADD COLUMN team_name VARCHAR(100) DEFAULT 'Support Team' AFTER position;
