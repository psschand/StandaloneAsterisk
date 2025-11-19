-- Migration: Alter ivr_menus table to add display/status fields
-- Description: Align IVR menus table with frontend requirements for builder UI

ALTER TABLE ivr_menus
    ADD COLUMN display_name VARCHAR(255) NULL AFTER name,
    ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active' AFTER max_attempts,
    ADD COLUMN invalid_option_action VARCHAR(50) NOT NULL DEFAULT 'repeat' AFTER status,
    ADD COLUMN timeout_action VARCHAR(50) NOT NULL DEFAULT 'repeat' AFTER invalid_option_action;

UPDATE ivr_menus
SET status = CASE
        WHEN is_active = TRUE THEN 'active'
        ELSE 'inactive'
    END;

UPDATE ivr_menus
SET display_name = name
WHERE (display_name IS NULL OR display_name = '');

UPDATE ivr_menus
SET invalid_option_action = 'repeat'
WHERE invalid_option_action IS NULL OR invalid_option_action = '';

UPDATE ivr_menus
SET timeout_action = 'repeat'
WHERE timeout_action IS NULL OR timeout_action = '';
