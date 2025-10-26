# ✅ SETUP COMPLETE - Current Status

## 📊 Current Configuration: **STATIC + ODBC Ready**

Your Asterisk is currently using:
- **✅ Static PJSIP config** (extensions 100/101 from `pjsip copy.conf`)
- **✅ ARI dialplan** (Stasis application routing)
- **✅ ODBC connected** to MySQL (ready for ARA)
- **✅ Database populated** with test PJSIP records

### What Just Happened:

1. ✅ All database migrations applied (31 tables created)
2. ✅ PJSIP test data loaded (extensions 100, 101 in database)
3. ✅ ARI dialplan deployed (`extensions.conf.ari` → `extensions.conf`)
4. ✅ ODBC module configured and connected to MySQL
5. ✅ Docker networking fixed (Asterisk ↔ MySQL communication)

---

## 🔧 How to Enable ARA (Database-Driven PJSIP)

Currently, Asterisk reads PJSIP from **static files**. To switch to **database (ARA)**:

### Option 1: Enable ARA with extconfig.conf

```bash
# Create extconfig.conf in Asterisk container
docker exec asterisk sh -c 'cat > /etc/asterisk/extconfig.conf << EOF
[settings]
ps_endpoints => odbc,asterisk,ps_endpoints
ps_auths => odbc,asterisk,ps_auths
ps_aors => odbc,asterisk,ps_aors
ps_contacts => odbc,asterisk,ps_contacts
EOF'

# Reload Asterisk
docker exec asterisk asterisk -rx "module load res_config_odbc.so"
docker exec asterisk asterisk -rx "module reload res_pjsip.so"
```

### Option 2: Keep Static Config (Current)

Your static config in `pjsip copy.conf` is working fine. You can keep using it alongside the database. The database records are there when you're ready to switch.

---

## 📞 Test Credentials

### SIP Extensions:
| Extension | Username | Password | Context |
|-----------|----------|----------|---------|
| 100 | 100 | changeme100 | internal |
| 101 | 101 | changeme101 | internal |

### SIP Server:
- **Host**: `<YOUR_IP>` or `138.2.68.107`
- **Port**: `5060`
- **Transport**: UDP

### Twilio Trunk:
- **Username**: Admin
- **Password**: Admin@1234567
- **Domain**: nlpbay.pstn.ashburn.twilio.com
- **Number**: +19863334949

---

## 🚀 Next Steps to Test ARI

### 1. Start the Go Backend

```bash
cd backend

# Set environment variables
export ASTERISK_ARI_URL="http://localhost:8088/ari"
export ASTERISK_ARI_USERNAME="asterisk"
export ASTERISK_ARI_PASSWORD="asterisk"
export ASTERISK_APP_NAME="callcenter"

# Run the backend
go run ./cmd/api
```

Expected output:
```
✅ Successfully connected to Asterisk ARI WebSocket
✅ Asterisk ARI handler started successfully
```

### 2. Configure SIP Softphone

Use Zoiper, Linphone, or any SIP client:

**Extension 100:**
- Username: `100`
- Password: `changeme100`
- Domain: `<YOUR_IP>:5060`

**Extension 101:**
- Username: `101`
- Password: `changeme101`
- Domain: `<YOUR_IP>:5060`

### 3. Make a Test Call

**Option A: From Asterisk CLI**
```bash
docker exec -it asterisk asterisk -rvvv
asterisk> channel originate PJSIP/100 application Stasis callcenter
```

**Option B: From Softphone**
- Register extension 100
- Dial `101`
- Call should be handled by Go backend via ARI

---

## 🔍 Verification Commands

### Check ODBC Connection:
```bash
docker exec asterisk asterisk -rx "odbc show all"
```
Expected: `Number of active connections: 1 (out of 10)`

### Check PJSIP Endpoints:
```bash
docker exec asterisk asterisk -rx "pjsip show endpoints"
```
Expected: Extensions 100 and 101 shown

### Check Dialplan:
```bash
docker exec asterisk asterisk -rx "dialplan show internal"
```
Expected: `Stasis(callcenter,internal,100)` for extension 100

### Check Database Records:
```bash
docker exec mysql mysql -u root -pcallcenterpass -e "
USE callcenter;
SELECT id, username, password FROM ps_auths;
SELECT id, callerid FROM ps_endpoints;"
```

### Check ARI WebSocket:
```bash
curl -u asterisk:asterisk http://localhost:8088/ari/endpoints
```

---

## 📋 What's in the Database

```sql
-- Tables created (31 total):
✅ tenants               -- Multi-tenant support
✅ users                 -- User accounts  
✅ user_roles            -- Role assignments
✅ dids                  -- Phone numbers
✅ queues                -- Call queues
✅ queue_members         -- Queue agents
✅ cdrs                  -- Call detail records
✅ agent_states          -- Agent status
✅ contacts              -- Customer contacts
✅ tickets               -- Helpdesk tickets
✅ chat_sessions         -- Live chat
✅ chat_messages         -- Chat history
✅ voicemail_messages    -- Voicemail storage
✅ sms_messages          -- SMS logs
✅ recordings            -- Call recordings
✅ ps_endpoints          -- PJSIP endpoints (ARA)
✅ ps_auths              -- PJSIP authentication (ARA)
✅ ps_aors               -- PJSIP address of record (ARA)
✅ ps_contacts           -- PJSIP live contacts (ARA)
... and 11 more tables
```

---

## ⚙️ Current Service Status

| Service | Status | Details |
|---------|--------|---------|
| **Asterisk** | ✅ Running | Container: `asterisk` |
| **MySQL** | ✅ Running | Container: `mysql` |
| **ODBC** | ✅ Connected | DSN: `asterisk-connector` |
| **PJSIP** | ✅ Active | Extensions: 100, 101 (static config) |
| **ARI** | ✅ Ready | App: `callcenter`, Port: 8088 |
| **Dialplan** | ✅ ARI Mode | Using Stasis() |
| **ARA** | ⏸️ Optional | Database ready, extconfig.conf needed to enable |

---

## 🎯 Call Flow

### Current Flow (Static PJSIP + ARI Dialplan):

```
Incoming Call (Twilio)
  ↓
extensions.conf [from-twilio]
  ↓
Stasis(callcenter, incoming, DID)
  ↓
Go Backend (ARI WebSocket)
  ↓
Auto-Answer → Play Greeting
  ↓
DTMF Menu (1=ext100, 2=ext101, #=hangup)
  ↓
Transfer to Extension → Bridge Channels
```

### Internal Calls:

```
Softphone Dials 101
  ↓
extensions.conf [internal]
  ↓
Stasis(callcenter, internal, 101)
  ↓
Go Backend (ARI)
  ↓
Create Bridge → Dial PJSIP/101 → Connect
```

---

## 📖 Documentation

- **`ARI_TESTING_GUIDE.md`** - Complete testing guide
- **`ARI_QUICK_REFERENCE.md`** - Quick command reference
- **`ARI_MIGRATION_STATUS.md`** - Migration details

---

## 🔄 Rollback Instructions

If you want to revert to traditional Dial() dialplan:

```bash
# Restore original dialplan
docker exec asterisk cp /etc/asterisk/extensions.conf.backup /etc/asterisk/extensions.conf
docker exec asterisk asterisk -rx "dialplan reload"
```

---

## 🎉 Summary

You now have:
1. ✅ **Working Asterisk** with static PJSIP config
2. ✅ **ARI-enabled dialplan** using Stasis()
3. ✅ **ODBC connected** to MySQL database
4. ✅ **Database populated** with PJSIP records (ready for ARA)
5. ✅ **Go backend ready** to control calls programmatically

**To answer your original question:**

> "the current asterisk container is serving from config file or database ARI?"

**Answer:** 
- **PJSIP Config**: Currently from **STATIC FILES** (`pjsip copy.conf`)
- **Dialplan**: Using **ARI** (Stasis application)
- **Database**: Connected and populated, ready for ARA when you enable it

The system is in a **hybrid mode** - ready for full database-driven operation but still using static PJSIP config for reliability. You can enable full ARA by creating `extconfig.conf` whenever you're ready.

---

**Next:** Start the Go backend and test making calls! 🚀
