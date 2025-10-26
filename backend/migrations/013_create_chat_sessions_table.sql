-- Migration: Create chat_sessions table
-- Description: Live chat conversation sessions

CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    widget_id BIGINT NOT NULL,
    session_key VARCHAR(100) NOT NULL UNIQUE,
    visitor_id VARCHAR(100),
    visitor_name VARCHAR(255),
    visitor_email VARCHAR(255),
    visitor_ip VARCHAR(100),
    visitor_user_agent TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    assigned_agent_id BIGINT,
    queue_position INT,
    waiting_time INT NOT NULL DEFAULT 0,
    rating INT,
    feedback TEXT,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_widget_id (widget_id),
    INDEX idx_session_key (session_key),
    INDEX idx_status (status),
    INDEX idx_assigned_agent_id (assigned_agent_id),
    INDEX idx_started_at (started_at),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (widget_id) REFERENCES chat_widgets(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
