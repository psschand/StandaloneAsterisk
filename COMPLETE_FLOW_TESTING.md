# Complete Flow Testing Guide - Multi-Website Architecture

## Prerequisites Checklist

- ✅ Backend running: `docker compose up -d backend`
- ✅ Frontend running: `npm run dev` (http://localhost:5173)
- ✅ Database seeded with demo data
- ✅ Test user credentials ready

## Test Credentials

```
Email: admin@callcenter.com
Password: Password123!
Tenant: demo-tenant (will be auto-detected after login)
```

---

## Test Flow 1: Login and Navigate

### Step 1: Login
1. Open browser to: http://localhost:5173/login
2. Enter credentials:
   - Email: `admin@callcenter.com`
   - Password: `Password123!`
3. Click "Login"

**Expected Result:** ✅ Redirected to dashboard

### Step 2: Navigate to Website Management
1. In the sidebar, expand "Agentic AI" module
2. Click on "Websites"

**Expected Result:** ✅ Website Management page loads showing existing websites

---

## Test Flow 2: Website Management (CRUD Operations)

### Test 2.1: View Existing Websites

**What to Check:**
- [ ] Page shows "Website Management" header
- [ ] Displays website count (should show 4-5 websites)
- [ ] Domain mode displayed (multiple/single)
- [ ] Website limit shown (X / 10)
- [ ] Each website card shows:
  - Website name
  - Domain
  - Description
  - Active status (green checkmark)
  - Edit and Delete buttons

**Expected Websites:**
1. E-commerce Store - `shop.democompany.com`
2. Support Portal - `support.democompany.com`
3. Marketing Site - `www.democompany.com`
4. Blog Platform - `blog.democompany.com`

### Test 2.2: Create New Website

1. Click "Add Website" button (top right)
2. Fill in the form:
   - **Name:** Customer Portal
   - **Domain:** portal.example.com
   - **Description:** Self-service customer portal
   - **Active:** ✓ (checked)
3. Click "Create"

**Expected Result:**
- ✅ Modal closes
- ✅ New website appears in the list
- ✅ Website count increments
- ✅ Success notification (if implemented)

### Test 2.3: Edit Website

1. Find "Customer Portal" website
2. Click the Edit icon (pencil)
3. Update:
   - **Description:** Updated: Self-service portal with account management
4. Click "Update"

**Expected Result:**
- ✅ Modal closes
- ✅ Website description updated
- ✅ Changes reflected immediately

### Test 2.4: Delete Website

1. Find "Customer Portal" website
2. Click the Delete icon (trash)
3. Confirm deletion

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ After confirming, website removed from list
- ✅ Website count decrements

### Test 2.5: Test Website Limit

1. Note current website count and limit
2. Try creating websites until limit is reached
3. Attempt to create one more

**Expected Result:**
- ✅ "Add Website" button becomes disabled at limit
- ✅ Hover shows "Website limit reached" message
- ✅ Or clicking shows alert about limit

---

## Test Flow 3: AI Profile Management (CRUD Operations)

### Step 1: Navigate to AI Profiles
1. In sidebar, under "Agentic AI", click "AI Profiles"

**Expected Result:** ✅ AI Profile Management page loads

### Test 3.1: View Existing AI Profiles

**What to Check:**
- [ ] Page shows "AI Profile Management" header
- [ ] Displays existing AI profiles (should show 4-5)
- [ ] Each profile card shows:
  - Profile name
  - Associated website
  - Model name (gemini-2.0-flash)
  - Temperature value
  - Max tokens
  - RAG status (Enabled/Disabled)
  - KB tags (colored badges)
  - Edit and Delete buttons
  - DEFAULT badge (if applicable)

**Expected Profiles:**
1. **E-commerce Support Bot**
   - Website: E-commerce Store
   - Tags: ecommerce, products, shipping, returns
   - Temperature: 0.7
   - DEFAULT: Yes

2. **Technical Support Bot**
   - Website: Support Portal
   - Tags: technical, support, troubleshooting, docs
   - Temperature: 0.5

3. **Sales & Marketing Bot**
   - Website: Marketing Site
   - Tags: marketing, sales, features, pricing
   - Temperature: 0.8

4. **Blog Content Bot**
   - Website: Blog Platform
   - Tags: blog, content
   - Temperature: 0.8

### Test 3.2: Create New AI Profile

1. Click "Add AI Profile" button
2. Fill in the form:
   - **Profile Name:** Customer Support Assistant
   - **Website:** Select "E-commerce Store"
   - **Description:** General customer support for all inquiries
   - **Model:** gemini-2.0-flash (default)
   - **Temperature:** 0.7 (use slider)
   - **Max Tokens:** 600
   - **System Prompt:** "You are a friendly customer support assistant. Help customers with their questions about products, orders, and account management."
   - **KB Tags:** Click: `ecommerce`, `support`, `general`, `faq`
   - **Enable RAG:** ✓ (checked)
   - **Set as default:** Leave unchecked
3. Click "Create"

**Expected Result:**
- ✅ Modal closes
- ✅ New AI profile appears in list
- ✅ Profile shows all entered details
- ✅ KB tags displayed as colored badges

### Test 3.3: Edit AI Profile

1. Find "Customer Support Assistant" profile
2. Click Edit icon
3. Update:
   - **Temperature:** 0.8 (adjust slider)
   - **Add more tags:** Click `contact`, `billing`
4. Click "Update"

**Expected Result:**
- ✅ Profile updated with new settings
- ✅ New tags appear
- ✅ Temperature shows 0.8

### Test 3.4: Test Tag Selection

1. Create or edit any profile
2. In the KB Tags section:
   - Click several tags to select them
   - Click again to deselect
   - Verify counter updates ("Selected: X tags")

**Expected Behavior:**
- ✅ Selected tags turn blue with white text
- ✅ Unselected tags are gray
- ✅ Counter updates in real-time

### Test 3.5: Delete AI Profile

1. Find "Customer Support Assistant" profile
2. Click Delete icon
3. Confirm deletion

**Expected Result:**
- ✅ Confirmation with warning about widgets
- ✅ Profile removed from list after confirmation

---

## Test Flow 4: Integration Testing (Website → AI Profile → Chat)

### Test 4.1: Create Complete Setup

1. **Create a new website:**
   - Name: Test E-commerce
   - Domain: test.example.com

2. **Create AI profile for this website:**
   - Profile Name: Test Store Bot
   - Website: Test E-commerce
   - Tags: test, ecommerce, products

3. **Verify the connection:**
   - Go back to Website Management
   - Confirm "Test E-commerce" exists
   - Go to AI Profile Management
   - Confirm "Test Store Bot" is linked to "Test E-commerce"

**Expected Result:**
- ✅ Website and profile created successfully
- ✅ Profile correctly associated with website
- ✅ Profile appears in list with website name

### Test 4.2: Verify Knowledge Base Filtering (Backend)

Using the API or database:

```bash
# Get the AI profile
curl -X GET "http://localhost:8001/api/v1/ai-agent-profiles" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.data[] | select(.profile_name == "E-commerce Support Bot") | .kb_tags'
```

**Expected Result:**
```json
["ecommerce", "products", "shipping", "returns"]
```

**Verify KB articles match tags:**
```bash
docker compose exec mysql mysql -u root -pcallcenterpass callcenter -e \
  "SELECT id, title, tags FROM knowledge_base 
   WHERE is_active=1 
   AND (JSON_CONTAINS(tags, '\"ecommerce\"') 
        OR JSON_CONTAINS(tags, '\"products\"'))
   LIMIT 5;"
```

**Expected Result:** ✅ Should return articles tagged with ecommerce or products

---

## Test Flow 5: UI/UX Testing

### Test 5.1: Responsive Design

1. Resize browser window to different sizes:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

**What to Check:**
- [ ] Website cards stack properly on mobile
- [ ] AI profile cards adjust layout
- [ ] Modals are responsive
- [ ] No horizontal scrolling
- [ ] Buttons remain accessible

### Test 5.2: Form Validation

**Website Form:**
1. Try creating website without name → Should show error
2. Enter very long name (>100 chars) → Should limit or warn
3. Enter special characters in domain → Should validate

**AI Profile Form:**
1. Try creating profile without name → Should show error
2. Set temperature to 0, then 1 → Slider should respond
3. Set max tokens to 99 → Should show minimum warning

### Test 5.3: Loading States

1. Open Website Management
2. Watch for loading spinner
3. Create a website
4. Watch for button disable during submit

**Expected:**
- ✅ Loading spinner appears while fetching
- ✅ Buttons disable during operations
- ✅ No duplicate submissions possible

### Test 5.4: Error Handling

**Test API Error:**
1. Stop the backend: `docker compose stop backend`
2. Try creating a website
3. Start backend: `docker compose start backend`

**Expected:**
- ✅ Error message displayed
- ✅ User not stuck in loading state
- ✅ Can retry after backend restarts

---

## Test Flow 6: Data Persistence

### Test 6.1: Refresh Test

1. Create a new website
2. Create a new AI profile
3. Refresh the browser (F5)
4. Navigate back to Website Management
5. Navigate to AI Profile Management

**Expected Result:**
- ✅ Still logged in
- ✅ New website still appears
- ✅ New AI profile still appears
- ✅ No data loss

### Test 6.2: Logout/Login Test

1. Note current websites and profiles
2. Logout
3. Login again
4. Check websites and profiles

**Expected Result:**
- ✅ All data persists
- ✅ Counts match previous session

---

## Test Flow 7: Edge Cases

### Test 7.1: Empty State

1. Delete all websites except one (if in single mode)
2. Check empty state message

**Expected:**
- ✅ Shows friendly empty state
- ✅ "Create first website" prompt
- ✅ Icon displayed

### Test 7.2: Default Profile Management

1. Create two AI profiles
2. Set one as default
3. Try setting another as default

**Expected:**
- ✅ Only one profile marked as DEFAULT
- ✅ Previous default loses DEFAULT badge

### Test 7.3: Website Association

1. Create AI profile with website
2. Delete that website
3. Check AI profile

**Expected:**
- ✅ Profile should handle missing website
- ✅ Shows "No website" or website ID
- ✅ No crashes

---

## Test Flow 8: Performance Testing

### Test 8.1: Load Time

1. Clear browser cache
2. Navigate to Website Management
3. Measure load time

**Expected:** ✅ Page loads in < 2 seconds

### Test 8.2: Search/Filter (if implemented)

1. Create 10+ websites
2. Test search functionality

**Expected:** ✅ Instant filtering, no lag

---

## Validation Checklist

### Frontend
- [ ] ✅ Login successful
- [ ] ✅ Website Management page accessible
- [ ] ✅ AI Profile Management page accessible
- [ ] ✅ Can create websites
- [ ] ✅ Can edit websites
- [ ] ✅ Can delete websites
- [ ] ✅ Website limit enforced
- [ ] ✅ Can create AI profiles
- [ ] ✅ Can edit AI profiles
- [ ] ✅ Can delete AI profiles
- [ ] ✅ KB tags selection works
- [ ] ✅ Website-profile association works
- [ ] ✅ Forms validate properly
- [ ] ✅ Error handling works
- [ ] ✅ Data persists across sessions
- [ ] ✅ Responsive design works

### Backend
- [ ] ✅ All API endpoints respond
- [ ] ✅ Authentication required
- [ ] ✅ Tenant isolation enforced
- [ ] ✅ Website CRUD operations work
- [ ] ✅ AI profile CRUD operations work
- [ ] ✅ KB tag filtering functional
- [ ] ✅ JSON fields handle null correctly
- [ ] ✅ Cascade deletes work

### Database
- [ ] ✅ Websites table populated
- [ ] ✅ AI profiles table populated
- [ ] ✅ KB articles have tags
- [ ] ✅ Foreign keys enforced
- [ ] ✅ Indexes working

---

## Known Issues to Watch For

1. **Empty Token** - If login returns null token, check tenant_id in request
2. **JSON Field Errors** - If "invalid JSON" errors, check supported_languages field
3. **Routes Not Found** - If 404, rebuild backend with `--no-cache`
4. **CORS Errors** - Check API_BASE_URL in frontend .env

---

## Success Criteria

The complete flow is successful if:

1. ✅ User can login
2. ✅ Can view, create, edit, delete websites
3. ✅ Can view, create, edit, delete AI profiles
4. ✅ AI profiles correctly link to websites
5. ✅ KB tags save and display properly
6. ✅ Website limits are enforced
7. ✅ Data persists across sessions
8. ✅ No console errors
9. ✅ Responsive on all devices
10. ✅ API responses are fast (< 500ms)

---

## Troubleshooting

### Issue: Can't see new pages in menu
**Solution:** Hard refresh browser (Ctrl+Shift+R) or clear cache

### Issue: API calls fail with 401
**Solution:** Re-login to get fresh token

### Issue: Changes not reflecting
**Solution:** 
1. Check browser console for errors
2. Check network tab for API responses
3. Verify backend logs: `docker compose logs backend --tail=50`

### Issue: Website/Profile not saving
**Solution:**
1. Check browser console
2. Check backend logs for SQL errors
3. Verify database schema is up to date

---

## Quick Test Command

Run this for a quick sanity check:

```bash
# Backend health
curl http://localhost:8001/health

# Check websites
TOKEN=$(curl -s -X POST "http://localhost:8001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@callcenter.com","password":"Password123!","tenant_id":"demo-tenant"}' \
  | jq -r '.data.access_token')

curl -s "http://localhost:8001/api/v1/websites" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

curl -s "http://localhost:8001/api/v1/ai-agent-profiles" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
```

**Expected Output:**
```
{"status":"ok"}
5
5
```

---

## Recording the Test

To record your test for demo purposes:

1. Use browser DevTools → Network tab
2. Screenshot each successful operation
3. Record video with browser screen recorder
4. Note any issues in comments

---

## Test Report Template

```
## Test Session Report

**Date:** [Date]
**Tester:** [Name]
**Duration:** [Time]

### Environment
- Backend: Running ✅ / Not Running ❌
- Frontend: Running ✅ / Not Running ❌
- Database: Connected ✅ / Issues ❌

### Test Results
- Website Management: PASS ✅ / FAIL ❌
- AI Profile Management: PASS ✅ / FAIL ❌
- Integration: PASS ✅ / FAIL ❌
- Performance: PASS ✅ / FAIL ❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

**Ready to test? Start with Test Flow 1 and work through sequentially!** 🚀
