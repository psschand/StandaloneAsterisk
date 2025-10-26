-- Migration: Create agent_states table
-- Description: Real-time agent availability states

CREATE TABLE IF NOT EXISTS agent_states (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    state VARCHAR(50) NOT NULL DEFAULT 'offline',
    reason VARCHAR(255),
    last_state_change TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_login_time INT NOT NULL DEFAULT 0,
    total_ready_time INT NOT NULL DEFAULT 0,
    total_break_time INT NOT NULL DEFAULT 0,
    total_away_time INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_tenant_user (tenant_id, user_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_state (state),
    INDEX idx_last_state_change (last_state_change),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
