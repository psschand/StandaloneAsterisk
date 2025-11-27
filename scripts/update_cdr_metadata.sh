#!/bin/bash
# Script to update CDR metadata (recording URLs and call direction)
# Run this via cron every minute or as needed

set -e

MYSQL_USER="${MYSQL_USER:-callcenter}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-callcenterpass}"
MYSQL_DATABASE="${MYSQL_DATABASE:-callcenter}"

docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" <<'SQL'
-- Update recording_url from userfield for records that don't have it
UPDATE cdrs 
SET recording_url = userfield 
WHERE userfield IS NOT NULL 
  AND userfield != '' 
  AND (recording_url IS NULL OR recording_url = '');

-- Populate application columns from Asterisk standard CDR columns
UPDATE cdrs SET caller_id = clid WHERE (caller_id IS NULL OR caller_id = '') AND clid IS NOT NULL AND clid != '';
UPDATE cdrs SET destination = dst WHERE (destination IS NULL OR destination = '') AND dst IS NOT NULL AND dst != '';
UPDATE cdrs SET call_date = calldate WHERE call_date IS NULL AND calldate IS NOT NULL;

-- Auto-detect and set call direction
UPDATE cdrs 
SET direction = CASE
    -- Inbound: calls from Twilio trunk
    WHEN channel LIKE '%twilio%' OR dcontext = 'from-twilio' THEN 'inbound'
    -- Outbound: calls to external numbers via outbound context
    WHEN dcontext = 'outbound' THEN 'outbound'
    -- Internal: extension to extension (3-4 digits on both ends)
    WHEN src REGEXP '^[0-9]{3,4}$' AND dst REGEXP '^[0-9]{3,4}$' THEN 'internal'
    -- Default to internal if within from-internal context
    WHEN dcontext = 'from-internal' THEN 'internal'
    ELSE direction
END
WHERE direction IS NULL OR direction = '';

SQL

echo "CDR metadata updated at $(date)"
