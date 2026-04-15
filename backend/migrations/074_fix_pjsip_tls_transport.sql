-- Migration 074: Fix TLS transport certificate configuration
--
-- Root cause: ps_transports is the authoritative source for PJSIP transports
-- (sorcery.conf maps `transport = realtime,ps_transports`). The static
-- [transport-tls] section in pjsip.conf is never read by a realtime-enabled
-- Asterisk instance.
--
-- The transport-tls row in ps_transports had NULL cert_file and priv_key_file,
-- so Asterisk loaded the TLS transport with no certificate — clients attempting
-- TLS connections would receive an SSL handshake failure.
--
-- The self-signed certificate was already present in the container at:
--   /etc/asterisk/keys/asterisk.crt  (cert, expires Oct 2026)
--   /etc/asterisk/keys/asterisk.key  (private key)
--   /etc/asterisk/keys/asterisk.pem  (combined cert+key)
--
-- After this fix, run:
--   docker exec asterisk asterisk -rx "module reload res_pjsip.so"
-- to pick up the change without a restart.

UPDATE ps_transports
SET
    cert_file     = '/etc/asterisk/keys/asterisk.crt',
    priv_key_file = '/etc/asterisk/keys/asterisk.key',
    method        = 'default'   -- use best available TLS version (not locked to tlsv1)
WHERE id = 'transport-tls';
