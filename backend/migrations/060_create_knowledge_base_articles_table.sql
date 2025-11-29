-- Create knowledge_base_articles table for file-based knowledge management
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  website_id BIGINT DEFAULT NULL COMMENT 'NULL = shared, value = brand-specific',
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  content_type ENUM('text','html','markdown','file') DEFAULT 'text' COMMENT 'Type of content: text/html/markdown or uploaded file',
  file_type VARCHAR(50) DEFAULT NULL COMMENT 'File extension: pdf, docx, doc, csv, txt, etc.',
  file_path VARCHAR(500) DEFAULT NULL COMMENT 'Path to uploaded file in storage',
  file_size BIGINT DEFAULT NULL COMMENT 'File size in bytes',
  file_original_name VARCHAR(255) DEFAULT NULL COMMENT 'Original filename when uploaded',
  extracted_text LONGTEXT COMMENT 'Text extracted from uploaded file (PDF, Word, etc.)',
  category VARCHAR(100) DEFAULT NULL,
  tags JSON DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0 COMMENT 'Higher = shown first',
  author_id BIGINT DEFAULT NULL,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tenant (tenant_id),
  INDEX idx_tenant_website_active (tenant_id, website_id, is_active),
  INDEX idx_file_type (tenant_id, website_id, file_type, is_active),
  FULLTEXT INDEX idx_content_search (title, content, extracted_text),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
