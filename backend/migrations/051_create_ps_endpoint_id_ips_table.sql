-- Migration: Create ps_endpoint_id_ips table for ARA endpoint identification
-- This table allows Asterisk to identify endpoints by username for registration

CREATE TABLE IF NOT EXISTS ps_endpoint_id_ips (
    id VARCHAR(40) NOT NULL,
    endpoint VARCHAR(40) NOT NULL,
    `match` VARCHAR(80) NOT NULL,
    PRIMARY KEY (id),
    KEY endpoint_idx (endpoint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add identification records for extensions 100 and 101
-- These allow registration based on username matching
INSERT INTO ps_endpoint_id_ips (id, endpoint, `match`) VALUES
('100-identify', '100', '100'),
('101-identify', '101', '101');
