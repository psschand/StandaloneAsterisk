-- Migration 073: Fix PJSIP endpoint deny/permit ACL restrictions
-- 
-- Problem: Extensions 1000 and 1001 had inline IP ACL rules:
--   deny  = 0.0.0.0/0.0.0.0        (block all IPs)
--   permit = 172.25.0.0/255.255.0.0  (only allow Docker internal network)
-- This caused all external SIP registrations to fail with "Not match Endpoint ACL"
-- even though correct credentials were provided.
--
-- Fix: Clear deny/permit fields for user extensions so Asterisk uses
-- credential-based digest auth only (no IP filtering for softphone extensions).
-- Twilio trunk keeps IP-based identify (ps_endpoint_id_ips table).

-- Add deny/permit columns if they don't exist (idempotent via information_schema)
SET @col_deny_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ps_endpoints'
    AND COLUMN_NAME = 'deny'
);

SET @col_permit_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ps_endpoints'
    AND COLUMN_NAME = 'permit'
);

-- Clear restrictive ACL for softphone endpoints (non-Twilio)
UPDATE ps_endpoints
SET
    deny = NULL,
    permit = NULL,
    acl = NULL,
    contact_deny = NULL,
    contact_permit = NULL,
    contact_acl = NULL
WHERE id NOT IN ('twilio_trunk');

-- Verify
SELECT id, deny, permit, acl FROM ps_endpoints ORDER BY id;
