-- Migration: Create ivr_options table
-- Description: Options/choices within IVR menus

CREATE TABLE IF NOT EXISTS ivr_options (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ivr_menu_id BIGINT NOT NULL,
    digit VARCHAR(10) NOT NULL,
    action VARCHAR(50) NOT NULL,
    action_data VARCHAR(500),
    description VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ivr_menu_id (ivr_menu_id),
    INDEX idx_digit (digit),
    INDEX idx_sort_order (sort_order),
    
    FOREIGN KEY (ivr_menu_id) REFERENCES ivr_menus(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
