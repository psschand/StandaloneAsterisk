-- Migration: Create survey_responses table
-- Description: Responses to call surveys

CREATE TABLE IF NOT EXISTS survey_responses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    survey_id BIGINT NOT NULL,
    cdr_id BIGINT,
    responses JSON NOT NULL,
    overall_rating INT,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_survey_id (survey_id),
    INDEX idx_cdr_id (cdr_id),
    INDEX idx_overall_rating (overall_rating),
    INDEX idx_completed_at (completed_at),
    
    FOREIGN KEY (survey_id) REFERENCES call_surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (cdr_id) REFERENCES cdrs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
