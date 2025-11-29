-- Migration: Create call_tags table
-- Description: Tags/labels for calls and CDRs

CREATE TABLE IF NOT EXISTS call_tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cdr_id BIGINT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cdr_id (cdr_id),
    INDEX idx_tag (tag),
    INDEX idx_created_by (created_by),
    
    FOREIGN KEY (cdr_id) REFERENCES cdrs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
