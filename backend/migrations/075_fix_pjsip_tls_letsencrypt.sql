-- Migration 075: Use Let's Encrypt certificate for SIP TLS transport
--
-- Replaces the self-signed /etc/asterisk/keys/asterisk.crt with the valid
-- Let's Encrypt certificate obtained and auto-renewed by Caddy.
--
-- Prerequisites:
--   docker-compose.yml must mount the caddy_data volume into the Asterisk
--   container at /caddy_certs (read-only). The asterisk entrypoint logs whether
--   the cert was found at startup.
--
-- Cert path inside the Asterisk container:
--   /caddy_certs/caddy/certificates/acme-v02.api.letsencrypt.org-directory/
--       app.soham.top/app.soham.top.crt
--
-- This is the full certificate chain (leaf + intermediates) written by Caddy
-- when it obtains/renews the cert. Caddy auto-renews ~30 days before expiry;
-- the Asterisk entrypoint runs a background watcher that reloads res_pjsip.so
-- whenever the cert file changes.
--
-- After applying this migration, reload without restart:
--   docker exec asterisk asterisk -rx "module reload res_pjsip.so"

UPDATE ps_transports
SET
    cert_file     = '/caddy_certs/caddy/certificates/acme-v02.api.letsencrypt.org-directory/app.soham.top/app.soham.top.crt',
    priv_key_file = '/caddy_certs/caddy/certificates/acme-v02.api.letsencrypt.org-directory/app.soham.top/app.soham.top.key',
    method        = 'sslv23'   -- OpenSSL SSLv23_method = TLS 1.0 through 1.3 (modern client compatible)
WHERE id = 'transport-tls';
