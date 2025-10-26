-- Migration: Create chat_transfers table
-- Description: Chat session transfer history

CREATE TABLE IF NOT EXISTS chat_transfers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    from_agent_id BIGINT,
    to_agent_id BIGINT,
    to_team VARCHAR(100),
    reason TEXT,
    transferred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_session_id (session_id),
    INDEX idx_from_agent_id (from_agent_id),
    INDEX idx_to_agent_id (to_agent_id),
    INDEX idx_transferred_at (transferred_at),
    
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (from_agent_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_agent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
