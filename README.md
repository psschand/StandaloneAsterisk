Standalone Asterisk Docker for Twilio SIP trunk and Zoiper softphones

Overview
- This folder contains a minimal Asterisk Docker image and compose setup to receive calls from a Twilio SIP trunk and allow softphones (Zoiper) to register as extensions.

Files
- Dockerfile: builds Asterisk 18 from source on Debian 12.
- docker-compose.yml: runs the container and maps SIP/RTP ports.
- entrypoint.sh: renders templates with environment variables and starts Asterisk.
- pjsip.conf.tpl, extensions.conf.tpl: simple templates for trunk and dialplan.
- rtp.conf, logger.conf, voicemail.conf: base configs.

Quick start
1. Copy and edit environment variables:
   cp .env.example .env
   - Set `ASTERISK_PUBLIC_IP` to the public address Twilio reaches (example defaults to `138.2.68.107`)
   - Confirm `TWILIO_SIP_DOMAIN`, `TWILIO_IPS`, `TWILIO_USERNAME`, `TWILIO_PASSWORD`, `TWILIO_ORIGINATING_NUMBER`
   - Update extension credentials (`EXT_100_*`, optionally `EXT_101_*`)

2. Customize `pjsip.conf.tpl` and `extensions.conf.tpl` or create static files under `config/` to override.

3. Build and run:
   docker compose build
   docker compose up -d

4. Inspect logs:
   docker logs -f asterisk

Twilio setup notes
- The provided templates use credential-based auth with the SIP domain `nlpbay.pstn.ashburn.twilio.com` and match on that host name in the identify section. If you add more Twilio regions or IPs, duplicate the `identify` block in `pjsip.conf` with additional `match=` values after the template renders.
- `TWILIO_ORIGINATING_NUMBER` is injected as the outbound caller ID and should match a verified Twilio number on the trunk.
- If you rely on IP ACL only, blank out `TWILIO_USERNAME` / `TWILIO_PASSWORD` and remove the `twilio_auth` block from `pjsip.conf` after the first render.

Zoiper / softphone setup
- Extension `100` is pre-configured; point Zoiper to the host IP on port 5060/UDP (username `100`, password from `.env`).
- To add more agents, duplicate the commented template in `pjsip.conf.tpl` and introduce new environment variables (e.g., `EXT_101_*`).

Security
- This is a minimal example. Hardening (SIP rate-limiting, TLS, SRTP, fail2ban) is strongly recommended before production use.

Troubleshooting
- If RTP audio fails, ensure the host firewall allows UDP 10000-20000 and configure `ASTERISK_PUBLIC_IP` in `.env` so SDP advertises the correct address.
- To re-render configs after editing `.env`, remove or clear files under `config/` so the container rehydrates them on the next start.

