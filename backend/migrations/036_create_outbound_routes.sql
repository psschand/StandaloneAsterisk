-- Migration: Create outbound_routes table
-- Description: Store outbound dial routing rules

CREATE TABLE IF NOT EXISTS outbound_routes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    pattern VARCHAR(100) NOT NULL COMMENT 'Regex pattern for matching dialed numbers',
    trunk_id VARCHAR(100) NOT NULL COMMENT 'SIP trunk endpoint ID',
    priority INT NOT NULL DEFAULT 100 COMMENT 'Lower = higher priority',
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    prepend VARCHAR(20) COMMENT 'Digits to prepend to dialed number',
    strip INT DEFAULT 0 COMMENT 'Number of leading digits to strip',
    caller_id_name VARCHAR(100),
    caller_id_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_priority (priority),
    INDEX idx_enabled (enabled),
    UNIQUE KEY unique_tenant_name (tenant_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default routes for demo-tenant (skip if exists)
INSERT IGNORE INTO outbound_routes (tenant_id, name, description, pattern, trunk_id, priority, enabled) VALUES
('demo-tenant', 'US/Canada', 'North America (NANP)', '^1[2-9][0-9]{9}$', 'twilio_trunk', 10, 1),
('demo-tenant', 'UK', 'United Kingdom', '^44[0-9]{10}$', 'twilio_trunk', 20, 1),
('demo-tenant', 'International', 'All other countries', '^\\+?[0-9]{8,15}$', 'twilio_trunk', 99, 1);
