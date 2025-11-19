# ⚡ Quick Setup: AI Agent + Knowledge Base

## 🚀 **3-Minute Setup Guide**

### **STEP 1: Add Knowledge (2 min)**
1. Login: http://138.2.68.107
   - `admin@callcenter.com` / `Password123!`
2. Go to: **Admin → Knowledge Base**
3. Click: **"Create Entry"**
4. Add 3-5 FAQs:
   ```
   Q: How long does shipping take?
   A: Standard shipping takes 3-5 business days. Express shipping 
      is available for additional fee and takes 1-2 business days.
   
   ✓ Mark as "Active"
   ✓ Add keywords: shipping, delivery, time
   ✓ Save
   ```

### **STEP 2: Enable AI (30 sec)**
1. Go to: **Admin → Chat Widget Designer**
2. Click: **"AI Agent & RAG"** tab
3. Check: ☑ **Enable AI Agent**
4. Check: ☑ **Enable RAG**
5. Set: **RAG Max Results: 3**
6. Set: **Confidence Threshold: 0.7**
7. Click: **"Save Changes"**

### **STEP 3: Test It (30 sec)**
1. Go to: **Admin → Knowledge Base**
2. Click: **"Test Query"** button (blue)
3. Type: `"How long does shipping take?"`
4. Click: **"Test Query"**
5. ✅ See AI response using your KB entry!

---

## 🎯 **What You Get**

✅ **AI reads from your Knowledge Base** (no hallucinations)  
✅ **Automatic confidence scoring** (handover when unsure)  
✅ **Real-time responses** (< 3 seconds)  
✅ **Usage tracking** (see which KB entries are popular)  
✅ **Smart handover** (transfers to human when needed)

---

## 📍 **Key URLs**

| Function | URL |
|----------|-----|
| Knowledge Base | http://138.2.68.107/admin/knowledge-base |
| AI Config | http://138.2.68.107/admin/chat-widget-designer |
| Test Chat | http://138.2.68.107/chat/widget-demo |
| AI Manager | http://138.2.68.107/ai-agents |

---

## 🧪 **Quick Test Commands**

```bash
# See AI processing
docker logs -f backend | grep -E 'AI|RAG|KB'

# Check KB entries
docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter \
  -e "SELECT id, question FROM knowledge_base_articles LIMIT 5;"

# Test API directly
curl -X POST http://138.2.68.107:8443/api/v1/knowledge-base/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"How long does shipping take?"}'
```

---

## ⚙️ **Key Settings**

| Setting | Recommended | Purpose |
|---------|-------------|---------|
| Enable RAG | ✓ ON | Use Knowledge Base |
| RAG Max Results | 3 | KB entries per query |
| Confidence Threshold | 0.7 | Handover if below |
| Temperature | 0.7 | AI creativity (0-1) |
| Max Tokens | 1000 | Response length |

---

## 🔍 **How It Works**

```
Customer Question
    ↓
AI Searches KB (MySQL FULLTEXT)
    ↓
Finds 3 Best Matches
    ↓
Sends to Gemini AI with KB Context
    ↓
Gemini Generates Response Using KB
    ↓
Calculates Confidence (0-1)
    ↓
If ≥0.7 → Respond
If <0.7 → Handover to Human
```

---

## 🎨 **Customize**

**Make AI more confident** (fewer handovers):
- Lower threshold: 0.7 → 0.6

**Make AI more cautious** (more handovers):
- Raise threshold: 0.7 → 0.8

**Change AI personality**:
- Edit system prompt in AI Agent Manager

**Filter KB by category**:
- Select specific categories in Widget Designer

---

## ✅ **Verify It's Working**

1. ✓ KB entries show "Active" status
2. ✓ AI Agent toggle is ON
3. ✓ RAG toggle is ON
4. ✓ Test Query returns response
5. ✓ Usage count increases after queries
6. ✓ Logs show "AI processing" messages

---

## 🆘 **Quick Fixes**

**AI not responding?**
```bash
docker compose restart backend
```

**KB not found?**
- Check entries are marked "Active"
- Check keywords match query

**Too many handovers?**
- Add more KB entries
- Lower confidence threshold to 0.6

---

## 📚 **Full Guide**

See complete documentation:
```bash
cat UI_GUIDE_AI_KB_TESTING.md
cat AI_KB_INTEGRATION_FLOW.md
```

---

**Status**: ✅ **LIVE & OPERATIONAL**  
**Ready to use!** 🚀
