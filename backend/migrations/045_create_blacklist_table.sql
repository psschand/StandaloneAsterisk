-- Migration: Create blacklist table
-- Description: Blocked phone numbers

CREATE TABLE IF NOT EXISTS blacklist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    reason TEXT,
    added_by BIGINT,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_tenant_phone (tenant_id, phone_number),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_phone_number (phone_number),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
