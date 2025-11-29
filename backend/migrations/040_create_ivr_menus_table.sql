-- Migration: Create ivr_menus table
-- Description: Interactive Voice Response menu configurations

CREATE TABLE IF NOT EXISTS ivr_menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    greeting_audio_url VARCHAR(500),
    greeting_text TEXT,
    timeout INT NOT NULL DEFAULT 5,
    max_attempts INT NOT NULL DEFAULT 3,
    invalid_audio_url VARCHAR(500),
    timeout_audio_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
