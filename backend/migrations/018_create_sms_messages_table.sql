-- Migration: Create sms_messages table
-- Description: SMS messages sent and received

CREATE TABLE IF NOT EXISTS sms_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    message_sid VARCHAR(100) UNIQUE,
    direction VARCHAR(20) NOT NULL,
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50),
    num_segments INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 4),
    price_unit VARCHAR(10),
    error_code VARCHAR(50),
    error_message TEXT,
    user_id BIGINT,
    contact_id BIGINT,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_message_sid (message_sid),
    INDEX idx_direction (direction),
    INDEX idx_from_number (from_number),
    INDEX idx_to_number (to_number),
    INDEX idx_user_id (user_id),
    INDEX idx_contact_id (contact_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
