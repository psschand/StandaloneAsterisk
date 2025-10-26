-- Migration: Create queue_members table
-- Description: Members (agents) assigned to queues

CREATE TABLE IF NOT EXISTS queue_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    queue_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    interface VARCHAR(100) NOT NULL,
    member_name VARCHAR(255),
    state_interface VARCHAR(100),
    penalty INT NOT NULL DEFAULT 0,
    paused INT NOT NULL DEFAULT 0,
    wrapup_time INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_queue_user (queue_id, user_id),
    INDEX idx_queue_id (queue_id),
    INDEX idx_user_id (user_id),
    INDEX idx_paused (paused),
    
    FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
