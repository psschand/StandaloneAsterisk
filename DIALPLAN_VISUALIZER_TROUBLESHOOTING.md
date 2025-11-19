# Dialplan Visualizer - Troubleshooting Guide

## Issue: "Edit Modal Not Appearing" & "Outbound Routes Empty List"

### Root Causes Fixed:
1. ✅ **Trunk ID mismatch** - Database had `twilio-trunk` but actual trunk is `twilio_trunk`
2. ✅ **Missing console logging** - Added debug logs for troubleshooting
3. ✅ **Migration file correction** - Updated default data to use correct trunk ID

### Solutions Applied:

#### 1. Database Fix
```sql
-- Fixed trunk_id in existing data
UPDATE outbound_routes SET trunk_id = 'twilio_trunk' WHERE trunk_id = 'twilio-trunk';
```

#### 2. Migration File Updated
File: `backend/migrations/015_create_outbound_routes.sql`
- Changed all instances of `'twilio-trunk'` to `'twilio_trunk'`
- Ensures future deployments use correct trunk ID

#### 3. Frontend Debug Logging
Added console.log statements to:
- Outbound routes API response
- Double-click event detection
- Node editing function

### How to Verify the Fixes:

#### Test 1: Check Outbound Routes Data
```bash
# SSH into server
docker compose exec mysql mysql -uroot -pcallcenterpass callcenter -e \
  "SELECT id, name, trunk_id, enabled FROM outbound_routes;"

# Expected output: 3 routes with trunk_id = 'twilio_trunk'
```

#### Test 2: Test API Endpoint
```bash
# From your authenticated session in browser, open DevTools Console
# You should see: "Outbound routes response: {success: true, data: [...]}"
```

#### Test 3: Test Edit Modal
1. Open **Dialplan Visualizer**
2. Switch to **Inbound** mode
3. Select any DID from dropdown
4. **Double-click** the blue DID node
5. Open browser DevTools → Console
6. Look for: "Double-clicked node: did, did-X"
7. Modal should appear with edit form

### Browser Console Debugging:

Open DevTools (F12) and check for these logs:

**Expected Success Logs:**
```
Outbound routes response: {success: true, data: Array(3)}
Double-clicked node: did did-123
Editing node: {id: "did-123", type: "did", ...}
```

**Error Indicators:**
```
Failed to fetch outbound routes: {error: ...}
Unauthorized / 401 error → Login again
```

### Common Issues:

#### Issue: "Outbound Routes Still Empty"

**Symptom:** Outbound tab shows no routing rules

**Diagnosis:**
```bash
# Check if routes exist
docker compose exec mysql mysql -uroot -pcallcenterpass callcenter -e \
  "SELECT COUNT(*) as route_count FROM outbound_routes WHERE enabled=1;"
```

**Solution:** If count = 0, manually insert:
```bash
docker compose exec mysql mysql -uroot -pcallcenterpass callcenter <<EOF
INSERT INTO outbound_routes (tenant_id, name, pattern, trunk_id, priority, enabled) VALUES
('default', 'US/Canada', '^1[2-9][0-9]{9}\$', 'twilio_trunk', 10, 1),
('default', 'UK', '^44[0-9]{10}\$', 'twilio_trunk', 20, 1),
('default', 'International', '^\\+?[0-9]{8,15}\$', 'twilio_trunk', 99, 1);
EOF
```

#### Issue: "Modal Not Opening on Double-Click"

**Symptom:** Double-clicking node does nothing

**Diagnosis:**
1. Open DevTools Console (F12)
2. Double-click a DID/Queue/IVR node
3. Check console for "Double-clicked node: ..." message

**Solutions:**
- **No console log?** → Hard refresh: Ctrl+Shift+R (Chrome) or Cmd+Shift+R (Mac)
- **Log shows but no modal?** → Check for React errors in console
- **Wrong node type?** → Only DID, Queue, IVR nodes are editable (not Extensions, Trunks, Outbound Rules)

#### Issue: "Trunk Not Found in Visualizer"

**Symptom:** Outbound flows don't show trunk connection

**Diagnosis:**
```bash
# Verify trunk exists
docker compose exec mysql mysql -uroot -pcallcenterpass callcenter -e \
  "SELECT id FROM ps_endpoints WHERE id = 'twilio_trunk';"
```

**Solution:** If empty, the trunk name mismatch is still present:
```bash
# Find actual trunk ID
docker compose exec mysql mysql -uroot -pcallcenterpass callcenter -e \
  "SELECT id FROM ps_endpoints WHERE id LIKE '%trunk%';"

# Update outbound_routes to match
# Replace 'actual_trunk_id' with the ID from above query
docker compose exec mysql mysql -uroot -pcallcenterpass callcenter -e \
  "UPDATE outbound_routes SET trunk_id = 'actual_trunk_id';"
```

#### Issue: "401 Unauthorized Error"

**Symptom:** API returns "Authorization required"

**Solution:**
1. Ensure you're logged in
2. Check that auth token is in localStorage
3. Open DevTools → Application → Local Storage → Check for `authToken`
4. If missing, log out and log back in

### Testing Checklist:

- [ ] Database has 3 outbound routes with `trunk_id = 'twilio_trunk'`
- [ ] Browser console shows "Outbound routes response: {success: true...}"
- [ ] Outbound Routes page (/outbound-routes) displays 3 routes
- [ ] Dialplan Visualizer → Outbound tab shows routing flows
- [ ] Double-clicking DID node opens edit modal
- [ ] Edit modal has route type dropdown and save button
- [ ] Saving changes refreshes the visualizer

### Advanced Debugging:

#### Enable Network Tab Monitoring:
1. Open DevTools → Network tab
2. Filter by "outbound-routes"
3. Reload Dialplan Visualizer
4. Check API response:
   - Status 200 = Success
   - Status 401 = Not authenticated
   - Status 500 = Server error

#### Check Backend Logs:
```bash
docker compose logs backend --tail=50 --follow
# Look for errors when accessing /api/v1/outbound-routes
```

#### Verify Frontend Container:
```bash
docker compose logs frontend --tail=20
# Should show nginx serving files
```

### Quick Reset (Nuclear Option):

If all else fails, rebuild everything:

```bash
cd /home/ubuntu/wsp/call-center/standalone-asterix

# Rebuild backend
docker compose build backend
docker compose up -d --force-recreate backend

# Rebuild frontend  
docker compose build frontend
docker compose up -d --force-recreate frontend

# Wait 10 seconds, then hard refresh browser (Ctrl+Shift+R)
```

### Contact Information:

If issues persist after trying all solutions:
1. Export browser console logs (Right-click → Save as...)
2. Export Network tab HAR file (Network → Export HAR)
3. Check backend logs: `docker compose logs backend --tail=100`

---

**Last Updated:** November 19, 2025  
**Version:** 1.0
