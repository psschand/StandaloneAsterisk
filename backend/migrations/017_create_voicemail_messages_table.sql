-- Migration: Create voicemail_messages table
-- Description: Voicemail messages for users

CREATE TABLE IF NOT EXISTS voicemail_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    mailbox VARCHAR(20) NOT NULL,
    context VARCHAR(100) NOT NULL DEFAULT 'default',
    message_number INT NOT NULL,
    caller_id VARCHAR(100),
    duration INT NOT NULL DEFAULT 0,
    flag VARCHAR(20),
    message_date TIMESTAMP NOT NULL,
    recording_url VARCHAR(500),
    transcription TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_mailbox (mailbox),
    INDEX idx_context (context),
    INDEX idx_message_date (message_date),
    INDEX idx_is_read (is_read),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
