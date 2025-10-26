-- Migration: Create cdrs table
-- Description: Call Detail Records for all calls

CREATE TABLE IF NOT EXISTS cdrs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    unique_id VARCHAR(100) NOT NULL UNIQUE,
    call_date TIMESTAMP NOT NULL,
    caller_id VARCHAR(100),
    destination VARCHAR(100),
    channel VARCHAR(100),
    destination_channel VARCHAR(100),
    direction VARCHAR(20),
    duration INT NOT NULL DEFAULT 0,
    billable_duration INT NOT NULL DEFAULT 0,
    disposition VARCHAR(50),
    recording_url VARCHAR(500),
    agent_id BIGINT,
    agent_name VARCHAR(255),
    queue_name VARCHAR(100),
    did_number VARCHAR(50),
    user_field VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_unique_id (unique_id),
    INDEX idx_call_date (call_date),
    INDEX idx_caller_id (caller_id),
    INDEX idx_destination (destination),
    INDEX idx_disposition (disposition),
    INDEX idx_agent_id (agent_id),
    INDEX idx_queue_name (queue_name),
    INDEX idx_direction (direction),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
