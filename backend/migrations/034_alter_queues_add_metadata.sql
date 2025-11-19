-- Migration: Alter queues table to add metadata column
-- Description: Store additional configuration data for queues

ALTER TABLE queues
    ADD COLUMN metadata JSON NULL AFTER status;
