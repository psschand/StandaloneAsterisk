-- Migration: Alter queues table to add overflow and announce columns
-- Description: Ensure queues table includes max_len and announce_hold_time used by service layer

ALTER TABLE queues
    ADD COLUMN max_len INT NOT NULL DEFAULT 0 AFTER max_wait_time,
    ADD COLUMN announce_hold_time BOOLEAN NOT NULL DEFAULT FALSE AFTER announce_frequency;
