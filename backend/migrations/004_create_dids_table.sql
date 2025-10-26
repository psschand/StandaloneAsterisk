-- Migration: Create dids table
-- Description: Direct Inward Dialing (DID) phone numbers

CREATE TABLE IF NOT EXISTS dids (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    number VARCHAR(50) NOT NULL UNIQUE,
    friendly_name VARCHAR(255),
    country_code VARCHAR(10),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    route_type VARCHAR(50),
    route_target VARCHAR(255),
    route_queue VARCHAR(100),
    route_user_id BIGINT,
    route_extension VARCHAR(20),
    capabilities JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_number (number),
    INDEX idx_status (status),
    INDEX idx_route_type (route_type),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (route_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
