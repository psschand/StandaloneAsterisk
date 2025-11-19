# Quick Testing Guide - New Omnichannel Navigation

**Updated:** November 4, 2025  
**Status:** READY TO TEST ✅

---

## 🚀 Quick Start

### 1. Access the Application

**Production (Recommended):**
```
http://localhost/
```

**Development:**
```
http://localhost:5174/
```

### 2. Login
```
Email:    admin@callcenter.com
Password: Password123!
Tenant:   demo-tenant
```

---

## 🎯 What to Test

### Test 1: New Navigation Structure (2 minutes)

1. **Login** with credentials above
2. **Look at the sidebar** - You should see:
   - 📞 Call Center
   - 💬 **Omnichannel Chat** ← This module changed!
   - 🧠 Agentic AI ← This module changed!
   - 🎫 Helpdesk
   - 👥 Teams & Collaboration
   - ⚙️ Admin & Settings

3. **Click on "Omnichannel Chat"** - You should see:
   ```
   💬 Omnichannel Chat
   ├─ 🌐 Websites & Properties        ← MOVED HERE!
   ├─ ✨ Channel AI Settings          ← MOVED HERE! (was "AI Profiles")
   ├─ 💬 Chat Widgets                 ← Renamed from "Widget Designer"
   ├─ 📥 Unified Inbox                ← NEW (coming soon)
   ├─ 💬 Live Chats
   ├─ 💭 Chat History (Soon)
   ├─ 📱 WhatsApp Business (Soon)     ← NEW!
   ├─ 📘 Facebook Messenger (Soon)    ← NEW!
   ├─ 📷 Instagram DM (Soon)          ← NEW!
   ├─ ✈️ Telegram (Soon)              ← NEW!
   └─ 🐦 Twitter DM (Soon)            ← NEW!
   ```

4. **Click on "Agentic AI"** - You should see:
   ```
   🧠 Agentic AI
   ├─ 📚 Knowledge Base
   ├─ 🤖 AI Agents
   ├─ 📄 Document Upload (Soon)
   ├─ ⚡ Training (Soon)
   └─ 📊 Analytics (Soon)
   ```

**Expected:** Websites and AI Profiles are NO LONGER in Agentic AI!

---

### Test 2: Websites & Properties (5 minutes)

1. **Click:** Omnichannel Chat → **Websites & Properties**

2. **You should see:**
   - Page title: "Website Management"
   - List of 4-5 existing websites
   - "Add Website" button in top right

3. **Test Create:**
   - Click "Add Website"
   - Fill in:
     - Name: Test Store
     - Domain: test.example.com
     - Description: Testing new navigation
     - Active: ✓
   - Click "Create"
   - ✅ New website should appear in list

4. **Test Edit:**
   - Click edit icon on "Test Store"
   - Change description
   - Click "Update"
   - ✅ Changes should save

5. **Test Delete:**
   - Click delete icon on "Test Store"
   - Confirm deletion
   - ✅ Website should disappear

---

### Test 3: Channel AI Settings (5 minutes)

1. **Click:** Omnichannel Chat → **Channel AI Settings**

2. **You should see:**
   - Page title: "AI Profile Management"
   - List of existing AI profiles
   - Each profile shows:
     - Profile name
     - Website association
     - Model name
     - Temperature
     - KB tags
   - "Add AI Profile" button

3. **Test Create:**
   - Click "Add AI Profile"
   - Fill in:
     - Profile Name: Test Bot
     - Website: Select any website
     - Description: Test AI for new navigation
     - Model: gemini-2.0-flash
     - Temperature: 0.7
     - Max Tokens: 500
     - System Prompt: "You are a helpful assistant"
     - KB Tags: Click a few tags (they turn blue)
     - Enable RAG: ✓
   - Click "Create"
   - ✅ New profile should appear

4. **Test Tag Selection:**
   - Edit any profile
   - Click multiple tags
   - Watch them turn blue when selected
   - Watch "Selected: X tags" counter update
   - ✅ Tag selection should work smoothly

5. **Test Delete:**
   - Delete the "Test Bot" profile
   - ✅ Should be removed from list

---

### Test 4: Chat Widgets (3 minutes)

1. **Click:** Omnichannel Chat → **Chat Widgets**

2. **You should see:**
   - The chat widget designer page
   - Same as before, just new menu location

3. **Verify:**
   - ✅ Page loads correctly
   - ✅ Existing widgets visible (if any)
   - ✅ Can modify widget settings

---

### Test 5: Social Media Placeholders (1 minute)

1. **In Omnichannel Chat module, scroll down**

2. **You should see (with "Soon" badges):**
   - 📱 WhatsApp Business
   - 📘 Facebook Messenger
   - 📷 Instagram DM
   - ✈️ Telegram
   - 🐦 Twitter DM

3. **Click any of them:**
   - ✅ Should show "Coming Soon" or 404 (expected)
   - These are placeholders for future features

---

### Test 6: Agentic AI Module (2 minutes)

1. **Click:** Agentic AI module

2. **Verify what's GONE:**
   - ❌ "Websites" should NOT be here anymore
   - ❌ "AI Profiles" should NOT be here anymore

3. **Verify what's THERE:**
   - ✅ Knowledge Base (stays here)
   - ✅ AI Agents
   - ✅ Document Upload (Soon)
   - ✅ Training (Soon)
   - ✅ Analytics (Soon)

---

## 🎨 Visual Comparison

### Before:
```
🧠 Agentic AI (Confusing!)
├─ AI Agents
├─ AI Profiles ❌ (wrong place)
├─ Websites ❌ (wrong place)
└─ Knowledge Base

💬 Omnichannel Chat (Incomplete)
├─ Live Chats
├─ Chat History
└─ Widget Designer
```

### After:
```
💬 Omnichannel Chat (Complete!) ⭐
├─ Websites & Properties ✨
├─ Channel AI Settings ✨
├─ Chat Widgets ✨
├─ Unified Inbox
├─ Live Chats
├─ Chat History
└─ Social Media (5 channels)

🧠 Agentic AI (Focused!)
├─ Knowledge Base
├─ AI Agents
├─ Document Upload
├─ Training
└─ Analytics
```

---

## ✅ Success Criteria

### Must Work:
- [x] Can login successfully
- [x] Omnichannel Chat module shows new items
- [x] Websites & Properties page loads
- [x] Channel AI Settings page loads
- [x] Can create/edit/delete websites
- [x] Can create/edit/delete AI profiles
- [x] Social media items show "Soon" badges
- [x] Agentic AI module doesn't show Websites/AI Profiles
- [x] Knowledge Base still accessible in Agentic AI

### Should See:
- [x] Clean, logical navigation
- [x] All channel setup in one module
- [x] Clear separation: Channels vs Intelligence
- [x] No broken links
- [x] No console errors

---

## 🐛 Common Issues

### Issue: "Websites" still shows in Agentic AI
**Solution:** Hard refresh browser (Ctrl+Shift+R) or clear cache

### Issue: Pages not loading
**Solution:** 
```bash
# Check frontend container
docker ps | grep frontend

# Check logs
docker logs frontend --tail=20

# Restart if needed
docker compose restart frontend
```

### Issue: Social media links give 404
**Expected:** These are placeholders for future features. They should show "Soon" badges in the menu.

---

## 📊 Quick Verification Commands

```bash
# Check frontend is running
curl -s http://localhost/ | grep "Omnichannel"

# Check bundle version
docker exec frontend ls /usr/share/nginx/html/assets/ | grep index

# Check dev server
curl -s http://localhost:5174/

# View logs
docker logs frontend --tail=20
tail -20 /tmp/frontend-dev.log

# Restart everything
cd /home/ubuntu/wsp/call-center/standalone-asterix
docker compose restart frontend
```

---

## 🎯 Testing Checklist

**Navigation:**
- [ ] Omnichannel Chat module expanded
- [ ] Websites & Properties appears first
- [ ] Channel AI Settings appears (not "AI Profiles")
- [ ] Chat Widgets appears (not "Widget Designer")
- [ ] Social media channels visible with "Soon" badges
- [ ] Agentic AI module simplified
- [ ] Knowledge Base still in Agentic AI

**Functionality:**
- [ ] Websites CRUD works
- [ ] AI Profiles CRUD works
- [ ] Widget Designer loads
- [ ] All existing features preserved
- [ ] No broken links
- [ ] No console errors

**User Experience:**
- [ ] Navigation makes sense
- [ ] Channel setup is intuitive
- [ ] All related features grouped together
- [ ] Future features clearly marked

---

## 🎉 Expected Results

After testing, you should feel:
- ✅ "This makes so much more sense!"
- ✅ "Everything for channels is in one place"
- ✅ "The workflow is logical now"
- ✅ "I can see where to add WhatsApp/Facebook"

---

## 📞 Report Issues

If you find any problems:

1. **Take a screenshot**
2. **Note which page/action caused it**
3. **Check browser console for errors** (F12)
4. **Check logs:**
   ```bash
   docker logs frontend --tail=50
   docker logs backend --tail=50
   ```

---

**Ready to test! Open http://localhost/ and explore!** 🚀
