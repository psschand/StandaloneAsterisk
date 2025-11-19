# Quick Test Guide - Uploaded Files Display

## 🎯 How to See the New Feature

### Step 1: Login
1. Go to http://138.2.68.107
2. Login with: `admin@callcenter.com` / `Password123!`

### Step 2: Navigate to Chat Widget Designer
1. Click on **Chat Widget Designer** in the sidebar
2. Select any widget from the list (e.g., "soham.top - Default Widget")

### Step 3: Go to AI Agent Tab
1. Click the **AI Agent** tab at the top
2. Scroll down past the RAG configuration section
3. You'll see the new **"Uploaded Files"** section

## 📸 What You'll See

```
╔═══════════════════════════════════════════════════════════╗
║  📄 Uploaded Files                         [🔄 Refresh]  ║
║  Files available for this chat widget's RAG system        ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  5 files available • Includes tenant-wide files           ║
║                                                            ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ 📄 story                                           │  ║
║  │ story.txt • 3.5 KB • General                       │  ║
║  │ ┌──────────────────────┐ ┌────────┐ 3,538 chars   │  ║
║  │ │ Available to all     │ │ Active │                │  ║
║  │ │ websites             │ └────────┘                │  ║
║  │ └──────────────────────┘                           │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                            ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ 📄 Master Service Agreement                        │  ║
║  │ Master_Service_Agreement.pdf • 136.0 KB • General  │  ║
║  │ ┌──────────────────────┐ ┌────────┐ 5,191 chars   │  ║
║  │ │ Available to all     │ │ Active │                │  ║
║  │ │ websites             │ └────────┘                │  ║
║  │ └──────────────────────┘                           │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                            ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ 📄 return policy                                   │  ║
║  │ return_policy.txt • 0.6 KB • Policies              │  ║
║  │ ┌──────────────────────┐ ┌────────┐ 655 chars     │  ║
║  │ │ Available to all     │ │ Active │                │  ║
║  │ │ websites             │ └────────┘                │  ║
║  │ └──────────────────────┘                           │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                            ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ 📄 product catalog                                 │  ║
║  │ product_catalog.csv • 0.5 KB • Products            │  ║
║  │ ┌──────────────────────┐ ┌────────┐ 573 chars     │  ║
║  │ │ Available to all     │ │ Active │                │  ║
║  │ │ websites             │ └────────┘                │  ║
║  │ └──────────────────────┘                           │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                            ║
║  ──────────────────────────────────────────────────────   ║
║  Note: These files are automatically included in the      ║
║  RAG system. Files marked as "Available to all websites"  ║
║  are shared across all chat widgets, while                ║
║  "Website-specific" files are only available to widgets   ║
║  on the same website.                                     ║
╚═══════════════════════════════════════════════════════════╝
```

## 🎨 Color Coding

- **Blue gradient background**: Main section
- **Purple badges**: "Available to all websites" (tenant-wide files)
- **Blue badges**: "Website-specific" files
- **Green badges**: Active status
- **Gray badges**: Inactive status

## 🧪 Test Uploading a Website-Specific File

### 1. Go to Knowledge Base Page
- Click **Knowledge Base** in sidebar

### 2. Click "Upload Document" Button

### 3. Select File and Website
- Choose a file (PDF, TXT, CSV, or DOCX)
- **Important**: Select a specific website from the dropdown
- Click Upload

### 4. Return to Chat Widget Designer
- Go back to Chat Widget Designer
- Select a widget that matches the website you chose
- Go to AI Agent tab
- Scroll to "Uploaded Files" section
- Click the **Refresh** button

### 5. You Should See
- Your newly uploaded file
- Badge: "Website-specific" (in blue)
- Only visible when viewing widgets from that same website

## 🔄 Testing the Filtering

### Test 1: Tenant-Wide Files (Current State)
All current files have `website_id = NULL`, so they appear for ALL widgets.

**Try This:**
1. Select widget: "soham.top - Default Widget" (website_id = 10)
2. Go to AI Agent tab → Uploaded Files section
3. Result: See all 5 tenant-wide files

### Test 2: Upload Website-Specific File
**Try This:**
1. Go to Knowledge Base → Upload Document
2. Select file: any test file
3. Website: Select "soham.top"
4. Upload the file
5. Go back to Chat Widget Designer
6. Select widget: "soham.top - Default Widget"
7. AI Agent tab → Uploaded Files → Click Refresh
8. Result: See tenant-wide files + your new website-specific file

### Test 3: Different Website
**Try This:**
1. Select widget: "Auto Widget Success - Default" (website_id = 9)
2. AI Agent tab → Uploaded Files
3. Result: See only tenant-wide files (NOT the soham.top specific file)

## ✅ What This Means

- **Tenant-wide files** (`website_id = NULL`): Available to ALL chat widgets
- **Website-specific files**: Only available to widgets on that website
- AI agent automatically uses the right files based on which widget the user is chatting with
- This display shows users exactly what files their AI can access

## 🎯 Key Features

1. **Auto-refresh**: Files load automatically when you select a widget
2. **Manual refresh**: Click the refresh button to reload the list
3. **Clear labels**: Easy to see which files are shared vs. website-specific
4. **File details**: Shows size, category, and extracted text length
5. **Status indicators**: See if files are active or inactive

## 🚀 Production Ready

- ✅ Backend API: `GET /api/v1/knowledge-base/files?website_id={id}`
- ✅ Frontend UI: Beautiful card-based display
- ✅ Auto-loading: Fetches files when needed
- ✅ Error handling: Graceful empty states and loading indicators
- ✅ Database filtering: Proper SQL queries with website filtering
- ✅ Deployed: Live at http://138.2.68.107

## 📝 Notes

- Files are **read-only** in this view (informational only)
- To upload new files: Use the Knowledge Base page
- To manage file status: Use the Knowledge Base page
- This section only appears when:
  - AI Agent is enabled (`enable_ai_agent = true`)
  - RAG is enabled (`enable_rag = true`)

---

**Happy Testing! 🎉**

The uploaded files display is now live and ready to use!
