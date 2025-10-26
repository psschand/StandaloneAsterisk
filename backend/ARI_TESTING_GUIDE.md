# ARI Integration - Testing Guide

## Overview

The system now uses **Asterisk ARI** (Asterisk REST Interface) for call control instead of traditional dialplan logic. This allows the Go backend to have full programmatic control over calls.

---

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Asterisk   │◄───WS───┤  Go Backend  │◄───WS───┤  WebSocket   │
│  (ARI App)   │         │  ARI Handler │         │   Clients    │
└──────┬───────┘         └──────┬───────┘         └──────────────┘
       │                        │
       │  Stasis(callcenter)    │  HTTP REST API
       │                        │
       ▼                        ▼
   Extensions              Webhooks
   (ARA/PJSIP)            External Systems
```

### Call Flow

1. **Incoming Call** → Asterisk receives call
2. **Stasis Application** → Routes to "callcenter" ARI app
3. **WebSocket Event** → Go backend receives `StasisStart` event
4. **Call Control** → Backend answers, plays audio, bridges, etc.
5. **Real-Time Updates** → Events broadcast via WebSocket to clients
6. **Call End** → `StasisEnd` event, cleanup

---

## Setup Steps

### 1. Enable ARI in Asterisk

Check `/etc/asterisk/ari.conf`:
```ini
[general]
enabled = yes
pretty = yes

[asterisk]
type = user
read_only = no
password = asterisk
```

### 2. Update Extensions Configuration

Replace `extensions.conf` with the ARI version:

```bash
cd /home/ubuntu/wsp/call-center/standalone-asterix
cp extensions.conf.ari extensions.conf

# Or via Docker
docker cp extensions.conf.ari asterisk:/etc/asterisk/extensions.conf
docker exec asterisk asterisk -rx "dialplan reload"
```

### 3. Load Seed Data

```bash
cd backend
mysql -u root -p callcenter < migrations/050_seed_test_data.sql
```

This creates:
- Test tenant: `test-tenant-001`
- Test users: `agent100@test.com` / `agent101@test.com` (password: `password123`)
- SIP extensions: 100 / 101 (SIP passwords: `agent100pass` / `agent101pass`)
- Test DIDs: `+19863334949`, `+15551234567`
- Test queues: `sales`, `support`

### 4. Configure SIP Softphones

#### Zoiper / LinPhone / X-Lite Configuration:

**Extension 100:**
- Username: `100`
- Password: `changeme100`
- Domain: `<YOUR_ASTERISK_IP>:5060`
- Display Name: `Agent One`

**Extension 101:**
- Username: `101`
- Password: `changeme101`
- Domain: `<YOUR_ASTERISK_IP>:5060`
- Display Name: `Agent Two`

### 5. Start Backend with ARI

```bash
cd backend

# Set ARI configuration
export ASTERISK_ARI_URL="http://localhost:8088/ari"
export ASTERISK_ARI_USERNAME="asterisk"
export ASTERISK_ARI_PASSWORD="asterisk"
export ASTERISK_ARI_APP="callcenter"

# Start server
go run ./cmd/api
```

**Expected Output:**
```
Database connected successfully
Repositories initialized
Redis connected successfully
WebSocket PubSubHub started (multi-server mode)
Webhook manager started with 10 workers
Event broadcaster initialized (WebSocket + Webhooks)
Connecting to ARI WebSocket: ws://localhost:8088/ari/events?app=callcenter&api_key=asterisk:asterisk
Successfully connected to Asterisk ARI WebSocket
Asterisk ARI handler started successfully
Services initialized
Handlers initialized
Starting server on 0.0.0.0:8000
```

---

## Testing Scenarios

### Test 1: Simple Incoming Call

**Using Asterisk CLI:**
```bash
# Generate test call to extension 100
asterisk -rx "channel originate PJSIP/100 application Stasis callcenter,incoming,100"
```

**Expected Behavior:**
1. ARI handler receives `StasisStart` event
2. Channel is answered automatically
3. "Hello World" sound plays
4. Call hangs up after 30 seconds

**Backend Logs:**
```
ARI Event: StasisStart
Incoming call: <channel-id> from 100 (Agent One)
Channel <channel-id> state changed to: Up
```

### Test 2: DTMF Menu

**Steps:**
1. Call extension 100
2. Press `1` → Transfers to extension 100
3. Press `2` → Transfers to extension 101
4. Press `#` → Hangs up

**Implementation** (in `ari_handler.go`):
```go
case "1":
    h.TransferToExtension(event.Channel.ID, "PJSIP/100")
case "2":
    h.TransferToExtension(event.Channel.ID, "PJSIP/101")
case "#":
    h.client.HangupChannel(event.Channel.ID)
```

### Test 3: Twilio Inbound Call

**Configure Twilio:**
1. Go to Twilio Console → Phone Numbers
2. Select your number (`+19863334949`)
3. Voice Configuration:
   - Configure with: `SIP`
   - SIP URI: `sip:+19863334949@<YOUR_PUBLIC_IP>`

**Call Flow:**
```
Twilio → Asterisk → from-twilio context → Stasis(callcenter,incoming,+19863334949)
       → ARI Handler → Answer → Play greeting
```

### Test 4: Internal Extension Dialing

**From Extension 100:**
```
Dial: 101
```

**Call Flow:**
```
PJSIP/100 → internal context → exten 101 → Stasis(callcenter,internal,101)
          → ARI Handler → Dial PJSIP/101 → Bridge
```

### Test 5: Outbound Call via Twilio

**From Extension 100:**
```
Dial: 9 + <10-digit number>
Example: 9 5551234567
```

**Call Flow:**
```
PJSIP/100 → internal → outbound context → Strip 9 → Dial(PJSIP/<number>@twilio_trunk)
```

### Test 6: Echo Test

**Dial:** `600`

**Behavior:**
- Answers call
- Echoes audio back (tests audio path)

### Test 7: Playback Test

**Dial:** `601`

**Behavior:**
- Plays "hello-world"
- Waits 2 seconds
- Plays "tt-monkeys"
- Hangs up

---

## ARI Events Reference

### Core Events Handled

| Event | Description | Handler Action |
|-------|-------------|----------------|
| `StasisStart` | Call enters ARI app | Answer, play greeting, auto-hangup timer |
| `StasisEnd` | Call leaves ARI app | Cleanup, remove from active channels |
| `ChannelStateChange` | Channel state changes | Update channel state |
| `ChannelDestroyed` | Channel destroyed | Remove from tracking |
| `ChannelDtmfReceived` | DTMF digit pressed | Process IVR menu |
| `ChannelEnteredBridge` | Channel joined bridge | Log bridge entry |
| `ChannelLeftBridge` | Channel left bridge | Log bridge exit |
| `BridgeCreated` | Bridge created | Track bridge |
| `BridgeDestroyed` | Bridge destroyed | Cleanup bridge |
| `PlaybackStarted` | Audio playback started | Track playback |
| `PlaybackFinished` | Audio playback finished | Cleanup playback |
| `RecordingStarted` | Recording started | Track recording |
| `RecordingFinished` | Recording finished | Save recording metadata |

---

## Verifying ARI Connection

### Check ARI WebSocket

```bash
# In Asterisk CLI
asterisk -rvvv
ari show apps

# Expected output:
# callcenter: (Not subscribed)
# or
# callcenter: WebSocket connected
```

### Test ARI REST API

```bash
# List channels
curl -u asterisk:asterisk http://localhost:8088/ari/channels

# List bridges
curl -u asterisk:asterisk http://localhost:8088/ari/bridges

# List endpoints
curl -u asterisk:asterisk http://localhost:8088/ari/endpoints
```

### Backend Logs

```bash
# Watch for ARI events
tail -f logs/app.log | grep ARI

# Expected:
# Successfully connected to Asterisk ARI WebSocket
# ARI Event: StasisStart
# ARI Event: ChannelStateChange
# Incoming call: <id> from <number>
```

---

## Troubleshooting

### Problem: "Failed to connect to ARI WebSocket"

**Solutions:**
1. Check Asterisk is running: `docker ps | grep asterisk`
2. Verify ARI is enabled: `docker exec asterisk cat /etc/asterisk/ari.conf`
3. Check ARI URL: `http://localhost:8088/ari` (not https)
4. Verify credentials: `asterisk:asterisk`

### Problem: Calls not routing to ARI

**Check:**
```bash
# Reload dialplan
asterisk -rx "dialplan reload"

# Show dialplan
asterisk -rx "dialplan show from-twilio"
asterisk -rx "dialplan show internal"

# Should see Stasis(callcenter) in output
```

### Problem: SIP Registration Failed

**Check:**
```bash
# Show PJSIP endpoints
asterisk -rx "pjsip show endpoints"

# Show AORs
asterisk -rx "pjsip show aors"

# Check contacts
asterisk -rx "pjsip show contacts"

# Expected:
# 100/100  <sip:100@<ip>>  Online  (auto)
```

### Problem: No Audio

**Check:**
1. RTP ports open: `10000-20000 UDP`
2. Codec mismatch: Both sides should support `ulaw` or `alaw`
3. NAT settings: `rtp_symmetric=yes`, `force_rport=yes`

---

## Advanced Features

### Custom Call Routing

Edit `ari_handler.go` → `onStasisStart()`:

```go
func (h *CallHandler) onStasisStart(event ARIEvent) {
    channel := event.Channel
    
    // Get DID from channel variable
    did, _ := h.client.GetChannelVariable(channel.ID, "DID")
    
    // Route based on DID
    switch did {
    case "+19863334949":
        // Route to sales queue
        h.RouteToQueue(channel.ID, "sales")
    case "+15551234567":
        // Route directly to agent 100
        h.TransferToExtension(channel.ID, "PJSIP/100")
    default:
        // Play IVR menu
        h.PlayIVRMenu(channel.ID)
    }
}
```

### Recording Calls

```go
// In onStasisStart or after answer
recording, err := h.client.StartRecording(
    channel.ID,
    fmt.Sprintf("call-%s-%d", channel.Caller.Number, time.Now().Unix()),
    "wav",
)
if err != nil {
    log.Printf("Failed to start recording: %v", err)
}
```

### Queue Integration

```go
func (h *CallHandler) RouteToQueue(channelID, queueName string) error {
    // Create a holding bridge
    bridge, err := h.client.CreateBridge("holding")
    if err != nil {
        return err
    }
    
    // Add caller to bridge
    h.client.AddChannelToBridge(bridge.ID, channelID)
    
    // Play music on hold
    h.client.PlaySound(channelID, "moh")
    
    // TODO: Query database for available agents in queue
    // TODO: Dial agent when available
    // TODO: Bridge caller with agent
    
    return nil
}
```

---

## Next Steps

1. **Integrate with WebSocket** - Broadcast call events to web dashboard
2. **Database Integration** - Log CDRs, update agent states
3. **Queue Management** - Implement queue logic with agent selection
4. **Call Recording** - Auto-record calls, store in S3/local
5. **IVR Menus** - Build DTMF menus from database
6. **Call Analytics** - Real-time dashboards, historical reports
7. **Webhook Integration** - Notify external systems on call events

---

## Resources

- **Asterisk ARI Docs**: https://wiki.asterisk.org/wiki/display/AST/Asterisk+REST+Interface+%28ARI%29
- **ARI Events**: https://wiki.asterisk.org/wiki/display/AST/Asterisk+REST+Data+Models
- **Stasis Application**: https://wiki.asterisk.org/wiki/display/AST/Building+WebSocket+Apps

🎉 **ARI integration complete!** Your call center can now handle calls programmatically via the Go backend.
