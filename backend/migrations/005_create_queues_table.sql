-- Migration: Create queues table
-- Description: Call queues for routing and distribution

CREATE TABLE IF NOT EXISTS queues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    strategy VARCHAR(50) NOT NULL DEFAULT 'ringall',
    timeout INT NOT NULL DEFAULT 30,
    retry INT NOT NULL DEFAULT 5,
    max_wait_time INT NOT NULL DEFAULT 300,
    announce_frequency INT NOT NULL DEFAULT 0,
    announce_position VARCHAR(10) NOT NULL DEFAULT 'no',
    music_on_hold VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_tenant_name (tenant_id, name),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
