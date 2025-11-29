-- Create products table for multi-website e-commerce support
CREATE TABLE IF NOT EXISTS products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  website_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) DEFAULT NULL,
  type ENUM('physical','digital','service','subscription','plan') NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  price DECIMAL(10,2) DEFAULT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  short_description VARCHAR(500) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  stock_quantity INT DEFAULT NULL,
  unlimited_stock BOOLEAN DEFAULT FALSE,
  metadata JSON DEFAULT NULL,
  images JSON DEFAULT NULL,
  slug VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_website_sku (website_id, sku),
  INDEX idx_tenant_website (tenant_id, website_id),
  INDEX idx_search (tenant_id, website_id, is_active),
  INDEX idx_sku (tenant_id, sku),
  FULLTEXT INDEX idx_name_desc (name, description),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
