-- Migration: Create webhook_logs table
-- Description: Webhook delivery logs

CREATE TABLE IF NOT EXISTS webhook_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    webhook_id BIGINT NOT NULL,
    event VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    response_code INT,
    response_body TEXT,
    error TEXT,
    duration_ms INT,
    attempt INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_webhook_id (webhook_id),
    INDEX idx_event (event),
    INDEX idx_created_at (created_at),
    INDEX idx_response_code (response_code),
    
    FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
