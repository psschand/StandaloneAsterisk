-- Migration: Create chat_widgets table
-- Description: Live chat widget configurations

CREATE TABLE IF NOT EXISTS chat_widgets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    widget_key VARCHAR(100) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    primary_color VARCHAR(20),
    title VARCHAR(255),
    subtitle VARCHAR(255),
    welcome_message TEXT,
    offline_message TEXT,
    position VARCHAR(20) NOT NULL DEFAULT 'bottom-right',
    avatar_url VARCHAR(500),
    allowed_domains JSON,
    settings JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_widget_key (widget_key),
    INDEX idx_enabled (enabled),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
