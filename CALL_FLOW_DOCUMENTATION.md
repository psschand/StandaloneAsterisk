# Asterisk-Twilio Call Center Configuration Documentation

## Overview

This document describes the complete call flow configuration for a dockerized Asterisk system integrated with Twilio SIP trunking. The system supports bidirectional calling between Twilio PSTN and local SIP extensions (Zoiper softphones).

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Twilio PSTN   │◄──►│  Asterisk Docker │◄──►│ SIP Extensions  │
│                 │    │                  │    │   (Zoiper)      │
│ 54.172.60.0/24  │    │  138.2.68.107    │    │ 100, 101       │
│ 54.244.51.0/24  │    │  Port 5060 UDP   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Network Configuration

### External Access
- **Host IP**: `138.2.68.107`
- **SIP Port**: `5060` (UDP/TCP)
- **RTP Ports**: `10000-10100` (UDP)

### Docker Port Mapping
```yaml
ports:
  - "5060:5060/udp"
  - "5060:5060/tcp" 
  - "10000-10100:10000-10100/udp"
```

## Configuration Files

### 1. PJSIP Configuration (`pjsip.conf`)

#### Transport Configuration
```ini
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0
external_signaling_address=138.2.68.107
external_media_address=138.2.68.107
allow_reload=yes
```

#### Twilio Trunk Identification
```ini
[twilio-na-us-identify]
type=identify
endpoint=twilio-na-us
match=54.172.60.0/24    ; Twilio POP subnet 1
match=54.244.51.0/24    ; Twilio POP subnet 2
match=138.2.68.107      ; Allow self for testing
```

#### Twilio Endpoint
```ini
[twilio-na-us]
type=endpoint
transport=transport-udp
context=from-twilio
disallow=all
allow=ulaw,alaw
dtmf_mode=rfc4733
rtp_symmetric=yes
force_rport=yes
rewrite_contact=yes
trust_id_inbound=yes
send_pai=yes
outbound_auth=twilio-na-us-auth
aors=twilio-na-us-aor
```

#### Authentication for Outbound Calls
```ini
[twilio-na-us-auth]
type=auth
auth_type=userpass
username=Admin
password=Admin@1234567
```

#### Address of Record (Multiple Twilio POPs)
```ini
[twilio-na-us-aor]
type=aor
contact=sip:54.172.60.1:5060
contact=sip:54.172.60.2:5060
contact=sip:54.172.60.3:5060
contact=sip:54.244.51.0:5060
contact=sip:54.244.51.1:5060
contact=sip:54.244.51.2:5060
qualify_frequency=60
```

### 2. Dialplan Configuration (`extensions.conf`)

#### Incoming Call Contexts

**From Twilio (`[from-twilio]`)**
```ini
; Route specific DID
exten => +19863334949,1,NoOp(Inbound Twilio call for ${EXTEN})
 same => n,Goto(internal,100,1)

; Route any +1 number  
exten => _+1.,1,NoOp(Inbound Twilio E.164 DID match ${EXTEN})
 same => n,Goto(internal,100,1)

; 10-digit fallback
exten => 9863334949,1,NoOp(Inbound Twilio 10-digit match ${EXTEN})
 same => n,Goto(internal,100,1)
```

**From PSTN (`[from-pstn]`)**
```ini
; Ring both extensions simultaneously
exten => +19863334949,1,NoOp(Incoming PSTN call for ${EXTEN})
 same => n,Answer()
 same => n,Dial(PJSIP/100&PJSIP/101,30,tT)
 same => n,Hangup()
```

#### Outbound Call Context (`[outbound]`)
```ini
; 9-prefix dialing
exten => _9+.,1,NoOp(Outbound via Twilio: ${EXTEN})
 same => n,Set(NUM=${EXTEN:1})
 same => n,Set(CALLERID(num)=${TWILIO_ORIGINATING_NUMBER})
 same => n,Set(CALLERID(name)=CallCenter)
 same => n,NoOp(Dialing E.164 number: ${NUM})
 same => n,Dial(PJSIP/twilio-na-us/sip:${NUM}@nlpbay.pstn.ashburn.twilio.com,30)
 same => n,Hangup()
```

#### Internal Extensions (`[internal]`)
```ini
exten => 100,1,NoOp(Ringing extension 100)
 same => n,Dial(PJSIP/100,20)
 same => n,Hangup()

exten => 101,1,NoOp(Ringing extension 101)
 same => n,Dial(PJSIP/101,20)
 same => n,Hangup()
```

## Call Flow Diagrams

### 📞 Incoming Call Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INCOMING CALL FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ CALL ORIGIN
   📱 Caller dials +1-986-333-4949
   ↓
   📡 Twilio PSTN receives call

2️⃣ TWILIO TO ASTERISK
   ↓
   🌐 Twilio POP (54.172.60.x or 54.244.51.x) sends SIP INVITE
   ↓
   📍 Destination: 138.2.68.107:5060 (Your Asterisk)
   ↓
   🐳 Docker forwards to Asterisk container

3️⃣ ASTERISK PROCESSING
   ↓
   🔍 PJSIP Identification:
   ├─ Source IP matches 54.172.60.0/24 or 54.244.51.0/24
   ├─ Maps to endpoint: twilio-na-us
   └─ Routes to context: from-twilio
   ↓
   📋 Dialplan Processing:
   ├─ Pattern _+1. matches +19863334949
   ├─ Executes: NoOp(Inbound Twilio E.164 DID match ${EXTEN})
   └─ Routes: Goto(internal,100,1)

4️⃣ EXTENSION RINGING
   ↓
   📞 Asterisk dials: PJSIP/100
   ↓
   🔔 Zoiper extension 100 rings

5️⃣ CALL ANSWERED
   ✅ Extension 100 answers
   🎯 RTP media flows: Twilio ↔ Asterisk ↔ Extension 100
```

### 📞 Outgoing Call Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OUTGOING CALL FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ EXTENSION INITIATES CALL
   📱 Extension 100 (Zoiper) dials: 915551234567
   ↓
   🔗 Authenticated via pjsip_wizard.conf (100-iauth/100)

2️⃣ ASTERISK PROCESSING
   ↓
   📋 Dialplan Processing:
   ├─ Context: internal (includes outbound)
   ├─ Pattern _9+. matches 915551234567
   ├─ Strips prefix: NUM=15551234567
   └─ Adds E.164: NUM=+115551234567

3️⃣ CALLER ID SETUP
   ↓
   📋 Set Variables:
   ├─ CALLERID(num)=${TWILIO_ORIGINATING_NUMBER}
   ├─ CALLERID(name)=CallCenter
   └─ Target: +115551234567

4️⃣ TRUNK AUTHENTICATION
   ↓
   🔐 Twilio Authentication:
   ├─ Username: Admin
   ├─ Password: Admin@1234567
   └─ Endpoint: twilio-na-us

5️⃣ CALL TO TWILIO
   ↓
   🌐 SIP INVITE sent to:
   ├─ Target: sip:+115551234567@nlpbay.pstn.ashburn.twilio.com
   ├─ From: 138.2.68.107
   └─ Via: One of the Twilio POP contacts

6️⃣ TWILIO ROUTING
   ↓
   📡 Twilio routes call to +115551234567
   ✅ Destination phone rings
```

## Dialing Patterns

### For Extensions (Internal Context)

| Pattern | Example | Description |
|---------|---------|-------------|
| `100` | `100` | Call extension 100 |
| `101` | `101` | Call extension 101 |
| `9+number` | `915551234567` | Outbound call (9 + 10-digit US number) |
| `9+1+number` | `9115551234567` | Outbound call (9 + 1 + 10-digit number) |

### For Extensions (From-Internal Context)

| Pattern | Example | Description |
|---------|---------|-------------|
| `+number` | `+15551234567` | Direct E.164 international dialing |
| `00+number` | `0015551234567` | International dialing (00 prefix) |
| `100`, `101` | `100` | Internal extension calling |

### Incoming Call Routing

| DID Format | Context | Destination |
|------------|---------|-------------|
| `+19863334949` | `from-twilio` | Extension 100 only |
| `+19863334949` | `from-pstn` | Extensions 100 & 101 (parallel) |
| Any `+1xxxxxxxxxx` | `from-twilio` | Extension 100 only |

## Security Configuration

### IP-Based Authentication
- **Twilio IPs**: Identified by subnet matching
- **No inbound authentication required** for calls from Twilio POPs
- **Outbound authentication required** for calls to Twilio

### Firewall Integration
```bash
# Block spam SIP traffic
iptables -N SIP-BLACKLIST
iptables -I DOCKER-USER -j SIP-BLACKLIST
iptables -A SIP-BLACKLIST -s <spam-ip> -j DROP
```

## Troubleshooting

### Common Issues

#### 1. Incoming Calls Fail
**Symptoms**: "No matching endpoint found"
**Check**:
```bash
docker compose exec asterisk asterisk -rx 'pjsip show identifies'
docker compose exec asterisk asterisk -rx 'pjsip show endpoint twilio-na-us'
```

#### 2. Outbound Authentication Fails  
**Symptoms**: "There were no auth ids available"
**Check**:
```bash
docker compose exec asterisk asterisk -rx 'pjsip show auth twilio-na-us-auth'
```

#### 3. Extensions Not Registering
**Check**:
```bash
docker compose exec asterisk asterisk -rx 'pjsip show endpoints' | grep -E '100|101'
```

### Log Monitoring
```bash
# Real-time call monitoring
docker compose exec asterisk tail -f /var/log/asterisk/messages | grep -E 'INVITE|Dial|from-twilio'

# Check recent activity
docker compose exec asterisk tail -n 50 /var/log/asterisk/messages
```
## Trace routes & log markers (Inbound vs Outbound)

This system instruments the dialplan with deterministic Log(NOTICE,TRACE: ...) markers so you can reliably see which context handled a call. Below is a short reference explaining which dialplan contexts emit TRACE markers, example lines, and quick commands to extract per-call timelines.

Why this matters
- TRACE markers make it easy to correlate network-level SIP messages (pcap) with in-Asterisk dialplan activity (which extensions/contexts executed). Use TRACE to answer "did this call run through outbound or was it matched directly in from-internal/from-twilio?"

Typical TRACE mapping
- from-twilio: incoming calls from Twilio POPs are identified by pjsip and routed to `from-twilio`. Typical TRACE line:

   [2025-10-18 00:03:43] NOTICE[199][C-0000000e] Ext. +19863334949: TRACE: from-twilio hit from-twilio/+19863334949 caller=hello

- from-pstn: similar to from-twilio but used for other PSTN / wizard routes. Example (before/after Dial markers may be present):

   [2025-10-18 00:37:03] NOTICE[2209][C-0000000f] Ext. +19863334949: TRACE: from-pstn hit from-pstn/+19863334949 caller=hello

- from-internal / internal: calls originated by internal devices (extensions) will hit one of these contexts. When an internal user dials E.164 (e.g. +181...), the `_+.` rule in `from-internal` will match and emit a TRACE. Example:

   [2025-10-18 01:36:03] NOTICE[7402][C-00000015] Ext. +18123894546: TRACE: from-internal hit from-internal/+18123894546 caller=100

- outbound: this context is used when dialing via the 9-prefix (`_9+.`). If your phone dials `9<number>` the `outbound` context's TRACE markers will be executed. Example (if matched):

   [2025-10-18 01:40:12] NOTICE[7500][C-00000016] Ext. 91551234567: TRACE: outbound before Dial outbound/91551234567 target=+15551234567 caller=100

Why a call might not show `outbound`
- If the extension sends an E.164 number (starts with `+`), the `_+.` pattern in `from-internal` will match first and handle the call there. The `outbound` context expects a leading `9` prefix (`_9+.`), so it will not be used unless the dialed digits begin with `9`.

Commands — live capture and trace extraction
- Start a host-side capture (SIP + RTP):

```bash
sudo tcpdump -i $(ip route get 8.8.8.8 | awk '{print $5; exit}') -w /tmp/live_sip_rtp.pcap \
   udp and \(port 5060 or portrange 10000-20000\) &
echo $! > /tmp/tcpdump_pid
```

- Tail the container Asterisk log and capture TRACE lines to a host file:

```bash
sudo bash -c "docker exec -i asterisk sh -c 'tail -n0 -F /var/log/asterisk/full | sed -n \"/TRACE:/p\"' > /tmp/live_asterisk_trace.log 2>&1 & echo \$! > /tmp/ast_tail_pid"
```

- After the call, stop the capture and tail (example):

```bash
sudo kill $(cat /tmp/tcpdump_pid) || true
sudo pkill -F /tmp/ast_tail_pid || true
# or use: sudo kill $(cat /tmp/ast_tail_pid)
```

- Extract SIP messages for a specific Call-ID from the pcap (text form):

```bash
sudo tcpdump -tttt -nn -r /tmp/live_sip_rtp.pcap -A 2>/dev/null | sed -n "/<CALL-ID>/,/<CALL-ID>/p"
# replace <CALL-ID> with the actual Call-ID string
```

- Grep the live trace file for channel or number

```bash
egrep -n "C-000000|\+181|outbound|from-internal|from-twilio" /tmp/live_asterisk_trace.log
```

Quick reproducible rule
- If you want all outbound calls to go through the `outbound` context regardless of whether the dialed digits start with `+` or `9`, change `from-internal` to forward its international matching to `outbound` (example shown below in Dialplan section). That ensures a single, consistent TRACE path for outbound dials.

## Extension Configuration (Zoiper)

### Extension 100
- **Server**: `138.2.68.107:5060`
- **Username**: `100`
- **Password**: `changeme100`
- **Protocol**: `SIP`

### Extension 101  
- **Server**: `138.2.68.107:5060`
- **Username**: `101`
- **Password**: `changeme101`
- **Protocol**: `SIP`

## Testing Procedures

### Test Incoming Calls
1. Configure Twilio to route DID `+19863334949` to your SIP endpoint
2. Call `+19863334949` from external phone
3. Verify extension 100 rings

### Test Outbound Calls
1. From extension 100, dial: `915551234567`
2. Verify call routes through Twilio
3. Check logs for proper E.164 formatting

### Test Internal Calls
1. From extension 100, dial: `101`
2. Verify extension 101 rings
3. No external routing should occur

## Maintenance

### Configuration Backups
```bash
# Backup configurations
cp docker/asterisk/config/pjsip.conf docker/asterisk/config/pjsip.conf.backup
cp docker/asterisk/config/extensions.conf docker/asterisk/config/extensions.conf.backup
```

### Reload Configurations
```bash
# Reload PJSIP after changes
docker compose exec asterisk asterisk -rx 'module reload res_pjsip'

# Reload dialplan after changes  
docker compose exec asterisk asterisk -rx 'dialplan reload'
```

### Monitor System Health
```bash
# Check endpoint status
docker compose exec asterisk asterisk -rx 'pjsip show endpoints'

# Check active calls
docker compose exec asterisk asterisk -rx 'core show channels'

# Check system status
docker compose ps
```

---

**Document Version**: 1.0  
**Last Updated**: October 14, 2025  
**Configuration**: Asterisk + Twilio SIP Trunking + Docker