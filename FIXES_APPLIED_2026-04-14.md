# Fixes Applied - 2026-04-14

This document summarizes the telephony, backend, and frontend fixes implemented during the April 14, 2026 troubleshooting session.

## 1) Active Calls API and Call Control

### Problem
- Active calls endpoint failed or returned incomplete data.
- Hangup support for active calls was missing.
- Frontend had references to call endpoints that were not implemented.

### Fixes
- Added active call API routes in backend router:
  - `GET /api/v1/calls/active`
  - `POST /api/v1/calls/:id/hangup`
- Added ARI client support to list channels.
- Implemented new call handler for active call listing and hangup.
- Added backend ARI environment variables in Docker compose so backend reaches Asterisk over container network instead of localhost.

### Files
- `backend/cmd/api/main.go`
- `backend/internal/asterisk/ari_client.go`
- `backend/internal/handler/call_handler.go`
- `docker-compose.yml`

## 2) ARI Timestamp Parsing Stability (500 Error Fix)

### Problem
- `/api/v1/calls/active` intermittently returned 500 when ARI returned timestamps with `+0000` timezone format.

### Fixes
- Added robust ARI timestamp parsing that accepts RFC3339 and `+0000` offset variants.
- Updated channel model timestamp type handling to prevent decode failures.

### Files
- `backend/internal/asterisk/ari_models.go`

## 3) Active Calls De-duplication and Status Behavior

### Problem
- Inbound/outbound logical calls appeared as duplicate rows (for example, separate `ringing` and `answered` legs).
- `Down` channels could appear and inflate counts.
- Outbound direction count was inaccurate in some cases.

### Fixes
- Filtered non-active channel states from active call output.
- Improved direction inference rules from dialplan context.
- Added logical-call deduplication to collapse multi-leg channels into one active call row.
- Deduplication now keys by normalized parties to avoid split entries when direction differs.
- Status priority adjusted so ringing status can be shown during alerting phase for collapsed rows.

### Files
- `backend/internal/handler/call_handler.go`

## 4) Frontend Calls Page and Dashboard Corrections

### Problem
- Calls page used unimplemented backend endpoints for make/answer actions.
- Dashboard card values stayed at 0 due to endpoint shape mismatch and invalid endpoint assumptions.

### Fixes
- Calls page make-call action switched to softphone context call flow.
- Removed/avoided unsupported call actions that relied on missing API routes.
- Calls page now displays both parties explicitly:
  - `From: <caller/extension>`
  - `To: <destination>`
- Dashboard active calls parsing updated to unwrap API envelope data.
- Dashboard now uses available backend data sources and derives card values from live data where needed.

### Files
- `frontend/src/pages/calls/Calls.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/contexts/SoftphoneContext.tsx`

## 5) Softphone Audio and Ringing Behavior

### Problem
- Ring tone/ringback behavior was inconsistent.
- Ringback continued after connection.
- Remote media handling used deprecated stream access patterns.

### Fixes
- Added audio context resume safeguards for browser autoplay policies.
- Added outgoing local ringback generation.
- Ensured ringback/ringtone stops on call establishment/termination.
- Switched remote media attachment to receiver/ontrack based handling.
- Added registration safeguards before placing calls.
- Added transport disconnect handling.

### Files
- `frontend/src/contexts/SoftphoneContext.tsx`

## 6) Music on Hold (601) Fix

### Problem
- Extension `601` MOH test did not play music because MOH class config was missing.

### Fixes
- Added `musiconhold.conf` with default class configuration pointing to `/var/lib/asterisk/moh`.
- Restart/reload path now has a valid MOH class available.

### Files
- `docker/asterisk/config/musiconhold.conf`

## 7) Supporting Runtime/Telephony Reliability Updates

### Fixes included in current change set
- Twilio trunk and transport configuration hardening.
- ODBC reconnect/sanity checks.
- Resolver configuration for DNS reliability.
- PWA icon/manifest consistency updates for frontend assets.

### Files
- `docker/asterisk/config/pjsip.conf`
- `docker/asterisk/config/pjsip.conf.tpl`
- `pjsip.conf.tpl`
- `docker/asterisk/config/res_odbc.conf`
- `docker/asterisk/odbc.ini`
- `docker/asterisk/config/resolver_unbound.conf`
- `frontend/public/manifest.json`
- `frontend/public/pwa-icon-192.png`
- `frontend/public/pwa-icon-512.png`

## Validation Summary
- Active calls endpoint now serves data with ARI timestamp tolerance.
- Calls page supports active call view and hangup with cleaner behavior.
- Inbound/outbound duplication handling implemented server-side.
- MOH class now present for 601 test.
- Frontend rebuilt and backend rebuilt multiple times during validation.
