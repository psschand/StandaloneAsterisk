-- Migration: Create chat_agents table
-- Description: Chat agent availability and settings

CREATE TABLE IF NOT EXISTS chat_agents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    max_concurrent_chats INT NOT NULL DEFAULT 5,
    current_chat_count INT NOT NULL DEFAULT 0,
    auto_accept BOOLEAN NOT NULL DEFAULT FALSE,
    away_message TEXT,
    skills JSON,
    last_activity_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_tenant_user (tenant_id, user_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_available (is_available),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
