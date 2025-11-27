# CDR Display Fix - Complete ✅

## Problem Summary
The CDR page was showing "N/A" for Caller, Callee, and Recording fields despite the database containing data.

## Root Cause Identified

### 1. **Database Column Mismatch**
- Asterisk CDR writes to standard columns: `clid`, `src`, `dst`, `userfield`
- Application backend reads from different columns: `caller_id`, `destination`, `recording_url`
- This caused a disconnect where Asterisk data wasn't visible to the application

### 2. **Caller ID Format Issues**
- Asterisk stores caller IDs in format: `"Name" <number>` or `"" <number>`
- Examples: `"" <hello>`, `"1000" <1000>`, `"" <>`
- These formatted strings were not user-friendly for display

## Solutions Implemented

### ✅ 1. Metadata Sync Script
Created `scripts/update_cdr_metadata.sh` to synchronize Asterisk columns to application columns:

```bash
./scripts/update_cdr_metadata.sh
```

This script:
- Copies `clid` → `caller_id`
- Copies `dst` → `destination`  
- Copies `userfield` → `recording_url`
- Auto-detects call direction (inbound/outbound/internal)

**Status**: ✅ Working - Run manually after calls are made

### ✅ 2. Caller ID Cleaning Function
Added `cleanCallerID()` function in backend to extract clean numbers/names:

**Before**:
```json
{
  "src": "\"\" <hello>",
  "dst": "1000"
}
```

**After**:
```json
{
  "src": "hello",
  "dst": "1000"
}
```

**Cleaning Rules**:
- `"" <hello>` → `hello`
- `"1000" <1000>` → `1000`
- `"" <>` → `""` (empty, displays as N/A)
- `100` → `100` (unchanged)
- `+15551234567` → `+15551234567` (unchanged)

**Status**: ✅ Implemented and deployed

## Verification

### API Test (Direct Backend)
```bash
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@callcenter.com","password":"Password123!"}' | jq -r '.data.access_token')

curl -X GET "http://localhost:8001/api/v1/cdr?tenant_id=demo-tenant&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, src, dst, recordingfile, direction}'
```

### API Test (Through Caddy Proxy)
```bash
TOKEN=$(curl -s -k -X POST "https://app.soham.top/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@callcenter.com","password":"Password123!"}' | jq -r '.data.access_token')

curl -s -k "https://app.soham.top/api/v1/cdr/19" \
  -H "Authorization: Bearer $TOKEN" | jq '{id, src, dst, recordingfile, direction}'
```

**Expected Output**:
```json
{
  "id": 19,
  "src": "hello",
  "dst": "1000",
  "recordingfile": "1764263141.44.wav",
  "direction": "inbound"
}
```

✅ **Status**: Both direct and proxied API calls working correctly

## Frontend Display

### How to See Updated Data

1. **Hard Refresh Browser**: Press `Ctrl + F5` (Windows/Linux) or `Cmd + Shift + R` (Mac)
2. **Or Clear Cache**: Browser Settings → Clear browsing data → Cached images and files
3. **Navigate to CDR Page**: The fields should now show:
   - **Caller**: Displays cleaned source number/name (e.g., "hello", "1000")
   - **Callee**: Displays destination number (e.g., "1000", "600")
   - **Recording**: Shows play button with WAV file (e.g., "1764263141.44.wav")
   - **Direction**: Shows inbound/outbound/internal
   - **Queue/Agent**: Shows queue name and agent name (if queue call)

### Display Logic (CDRs.tsx)
```tsx
{cdr.src || 'N/A'}  // Shows number or N/A if empty
{cdr.dst || 'N/A'}  // Shows number or N/A if empty
{cdr.recordingfile ? <PlayButton /> : <span>-</span>}  // Play button if recording exists
```

## Automation (Pending)

The metadata sync script currently needs to be run manually. For automation, consider:

### Option 1: Systemd Timer (Recommended)
Create a systemd timer to run the script every minute:

```bash
# Create service file
sudo tee /etc/systemd/system/cdr-metadata-sync.service <<EOF
[Unit]
Description=CDR Metadata Sync

[Service]
Type=oneshot
WorkingDirectory=/home/ubuntu/wsp/call-center/standalone-asterix
ExecStart=/home/ubuntu/wsp/call-center/standalone-asterix/scripts/update_cdr_metadata.sh
EOF

# Create timer file
sudo tee /etc/systemd/system/cdr-metadata-sync.timer <<EOF
[Unit]
Description=Run CDR Metadata Sync every minute

[Timer]
OnBootSec=1min
OnUnitActiveSec=1min

[Install]
WantedBy=timers.target
EOF

# Enable and start timer
sudo systemctl daemon-reload
sudo systemctl enable cdr-metadata-sync.timer
sudo systemctl start cdr-metadata-sync.timer
```

### Option 2: Docker Container with Cron
Add a separate service to docker-compose.yml that runs the script periodically.

### Option 3: Backend Integration
Modify backend to automatically populate application columns on CDR insert using database triggers or ORM hooks.

## Testing Checklist

- [x] Database has data in Asterisk columns (`clid`, `dst`, `userfield`)
- [x] Metadata sync script populates application columns (`caller_id`, `destination`, `recording_url`)
- [x] Backend API returns cleaned caller IDs
- [x] API returns recording filenames
- [x] API returns call direction
- [x] API accessible through Caddy proxy
- [ ] **Frontend displays data correctly** (User needs to hard refresh browser)
- [ ] Recording playback works (click play button on recordings)
- [ ] Automation setup for metadata sync

## Sample Data

### Database (After Sync)
```
ID | caller_id      | destination | recording_url           | direction
---+----------------+-------------+-------------------------+-----------
19 | "" <hello>"    | 1000        | 1764263141.44.wav       | inbound
18 | "" <hello>"    | 1000        | 1764263089.41.wav       | inbound
14 | "1000" <1000>" | 600         | 1764247069.32.wav       | internal
```

### API Response (Cleaned)
```json
[
  {
    "id": 19,
    "src": "hello",
    "dst": "1000",
    "recordingfile": "1764263141.44.wav",
    "direction": "inbound"
  },
  {
    "id": 18,
    "src": "hello",
    "dst": "1000",
    "recordingfile": "1764263089.41.wav",
    "direction": "inbound"
  },
  {
    "id": 14,
    "src": "1000",
    "dst": "600",
    "recordingfile": "1764247069.32.wav",
    "direction": "internal"
  }
]
```

## Next Steps

1. ✅ **Backend Fixed**: Caller IDs are cleaned, API returns correct data
2. 🔄 **User Action Required**: Hard refresh browser (Ctrl+F5) to see updated CDR data
3. ⏳ **Optional**: Set up automation for metadata sync (systemd timer or cron)
4. ⏳ **Optional**: Add recording playback endpoint if recordings should be downloadable

## Files Modified

1. **backend/internal/service/cdr_service.go**
   - Added `cleanCallerID()` function to parse Asterisk caller ID format
   - Updated `toCDRResponse()` to use cleaned caller IDs

2. **scripts/update_cdr_metadata.sh**
   - Created metadata sync script to populate application columns

## Support

If frontend still shows "N/A" after hard refresh:
1. Check browser console (F12) for errors
2. Verify API call in Network tab returns data
3. Check if frontend auth token is valid (localStorage.getItem('accessToken'))
4. Try logging out and logging back in

---

**Status**: ✅ **Backend Complete** | 🔄 **Pending User Browser Refresh**
