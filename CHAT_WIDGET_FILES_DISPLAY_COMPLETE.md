# Chat Widget Designer - Uploaded Files Display Implementation ✅

**Status**: COMPLETE  
**Date**: November 7, 2025  
**Feature**: Display uploaded files in Chat Widget Designer RAG section

---

## 🎯 Objective

Add a section in the Chat Widget Designer to show all uploaded files that are available for the chat widget's RAG (Retrieval-Augmented Generation) system. This allows users to:
- See which files are available for a specific chat widget
- Distinguish between tenant-wide and website-specific files
- Understand what content the AI agent can access

---

## 📋 Implementation Summary

### Backend Changes

#### 1. New API Endpoint
**File**: `backend/internal/handler/knowledge_base_handler.go`
- **Endpoint**: `GET /api/v1/knowledge-base/files?website_id={id}`
- **Function**: `ListUploadedFiles()`
- **Purpose**: Fetch uploaded files filtered by website_id

```go
func (h *KnowledgeBaseHandler) ListUploadedFiles(c *gin.Context) {
    tenantID := c.GetString("tenant_id")
    websiteIDStr := c.Query("website_id")
    
    var websiteID *int64
    if websiteIDStr != "" && websiteIDStr != "null" {
        if id, err := strconv.ParseInt(websiteIDStr, 10, 64); err == nil {
            websiteID = &id
        }
    }
    
    files, err := h.service.ListUploadedFiles(c.Request.Context(), tenantID, websiteID)
    if err != nil {
        response.Error(c, err)
        return
    }
    
    response.Success(c, files)
}
```

#### 2. Service Layer
**File**: `backend/internal/chat/knowledge_base_service.go`
- **Function**: `ListUploadedFiles(tenantID, websiteID)`
- **Logic**: Returns files where `(website_id IS NULL OR website_id = ?)` to include:
  - Tenant-wide files (website_id = NULL)
  - Website-specific files matching the widget's website

```go
type UploadedFileInfo struct {
    ID               int64     `json:"id"`
    Title            string    `json:"title"`
    FileName         string    `json:"file_name"`
    FileOriginalName string    `json:"file_original_name"`
    FileSize         int64     `json:"file_size"`
    FileType         string    `json:"file_type"`
    Category         string    `json:"category"`
    Language         string    `json:"language"`
    WebsiteID        *int64    `json:"website_id"`
    IsActive         bool      `json:"is_active"`
    CreatedAt        time.Time `json:"created_at"`
    TextLength       int       `json:"text_length"`
}
```

#### 3. Route Registration
**File**: `backend/cmd/api/main.go`
- Added route: `kb.GET("/files", knowledgeBaseHandler.ListUploadedFiles)`

### Frontend Changes

#### 1. New Interface
**File**: `frontend/src/pages/ChatWidgetDesigner.tsx`

```typescript
interface UploadedFile {
  id: number;
  title: string;
  file_name: string;
  file_original_name: string;
  file_size: number;
  file_type: string;
  category: string;
  language: string;
  website_id: number | null;
  is_active: boolean;
  created_at: string;
  text_length: number;
}
```

#### 2. State Management
Added new state variables:
```typescript
const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
const [loadingFiles, setLoadingFiles] = useState(false);
```

#### 3. Data Fetching
New function to fetch files:
```typescript
const fetchUploadedFiles = async (websiteId: number | null) => {
  setLoadingFiles(true);
  try {
    const params = websiteId ? `?website_id=${websiteId}` : '';
    const response = await axios.get(`/api/v1/knowledge-base/files${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.data.success) {
      setUploadedFiles(response.data.data || []);
    }
  } catch (error) {
    console.error('Failed to fetch uploaded files:', error);
    setUploadedFiles([]);
  } finally {
    setLoadingFiles(false);
  }
};
```

#### 4. Auto-loading with useEffect
Files are automatically loaded when:
- User switches to AI Agent tab
- A widget is selected

```typescript
useEffect(() => {
  if (activeTab === 'ai-agent' && selectedWidgetId) {
    const selectedWidget = widgets.find(w => w.id === selectedWidgetId);
    if (selectedWidget) {
      fetchUploadedFiles(selectedWidget.website_id);
    }
  }
}, [activeTab, selectedWidgetId, widgets]);
```

#### 5. UI Component
Beautiful card-based display with:
- **Header**: Shows title, description, and refresh button
- **File Cards**: Each file displayed with:
  - File icon (FileText from Lucide)
  - Title and original filename
  - File size in KB
  - Category badge
  - Status badges:
    - "Available to all websites" (purple) for tenant-wide files
    - "Website-specific" (blue) for website-scoped files
    - Active/Inactive status
  - Character count of extracted text
- **Empty State**: Helpful message when no files exist
- **Loading State**: Spinner while fetching data
- **Help Text**: Explains how files are automatically included

---

## 🎨 Visual Design

### Color Scheme
- **Background**: Gradient from blue-50 to indigo-50
- **Border**: Blue-200
- **Icon Badge**: Blue-100 with blue-600 icon
- **Tenant-wide Badge**: Purple-100 with purple-800 text
- **Website-specific Badge**: Blue-100 with blue-800 text
- **Active Status**: Green-100 with green-800 text

### Layout
```
┌─────────────────────────────────────────────────────┐
│ 📄 Uploaded Files                      [🔄 Refresh] │
│ Files available for this chat widget's RAG system   │
├─────────────────────────────────────────────────────┤
│ 5 files available • Includes tenant-wide files      │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📄 story                                        │ │
│ │ story.txt • 3.5 KB • General                    │ │
│ │ [Available to all websites] [Active] 3538 chars │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📄 return policy                                │ │
│ │ return_policy.txt • 0.6 KB • Policies           │ │
│ │ [Available to all websites] [Active] 655 chars  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Note: These files are automatically included...     │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

1. **Widget Selection**: User selects a chat widget in Chat Widget Designer
2. **Tab Switch**: User navigates to "AI Agent" tab
3. **Auto-fetch**: useEffect triggers `fetchUploadedFiles(widget.website_id)`
4. **API Call**: `GET /api/v1/knowledge-base/files?website_id={id}`
5. **Backend Query**: 
   ```sql
   SELECT * FROM knowledge_base_articles 
   WHERE tenant_id = 'demo-tenant' 
   AND (website_id IS NULL OR website_id = ?)
   ORDER BY created_at DESC
   ```
6. **Response**: Array of UploadedFileInfo objects
7. **State Update**: `setUploadedFiles(files)`
8. **UI Render**: File cards displayed with all metadata

---

## 📊 Current Database State

### Uploaded Files
```
ID  | Title                    | File              | Category  | Website | Active | Size
----|--------------------------|-------------------|-----------|---------|--------|-------
11  | story                    | story.txt         | General   | NULL    | Yes    | 3.5 KB
10  | story                    | story.txt         | General   | NULL    | Yes    | 3.5 KB
9   | Master Service Agreement | MSA.pdf           | General   | NULL    | Yes    | 136 KB
8   | return policy            | return_policy.txt | Policies  | NULL    | Yes    | 0.6 KB
7   | product catalog          | catalog.csv       | Products  | NULL    | Yes    | 0.5 KB
```

### Chat Widgets
```
ID | Name                               | Website ID
---|------------------------------------|-----------
3  | soham.top - Default Widget         | 10
2  | Auto Widget Success - Default      | 9
1  | Soham Default Public Widget        | NULL
```

### Websites
```
ID  | Name
----|----------------------
1   | E-commerce Store
2   | Support Portal
3   | Marketing Site
9   | Auto Widget Success
10  | soham.top
```

---

## 🧪 Testing

### Test Scenario 1: Widget with Website ID
**Widget**: "soham.top - Default Widget" (website_id = 10)
**Expected Files**: All 5 tenant-wide files (website_id = NULL)
**API Call**: `GET /api/v1/knowledge-base/files?website_id=10`

### Test Scenario 2: Widget without Website ID
**Widget**: "Soham Default Public Widget" (website_id = NULL)
**Expected Files**: All 5 tenant-wide files only
**API Call**: `GET /api/v1/knowledge-base/files`

### Test Scenario 3: Upload Website-Specific File
1. Go to Knowledge Base page
2. Upload a file for website "soham.top" (ID=10)
3. Return to Chat Widget Designer
4. Select "soham.top - Default Widget"
5. Go to AI Agent tab
6. Should see: Tenant-wide files + new website-specific file

---

## 🚀 Deployment

### Backend
```bash
cd /home/ubuntu/wsp/call-center/standalone-asterix
docker compose build backend
docker compose up -d backend
```
**Status**: ✅ Deployed (Build time: 88.3s)

### Frontend
```bash
cd frontend
npm run build
docker cp dist/. frontend:/usr/share/nginx/html/
```
**Status**: ✅ Deployed (Bundle size: 662.75 KB)

---

## 🎯 User Benefits

1. **Visibility**: Users can now see exactly what files are available for RAG
2. **Clarity**: Clear distinction between tenant-wide and website-specific files
3. **Transparency**: Shows file size, category, and text extraction stats
4. **Confidence**: Users know what content the AI agent can access
5. **Management**: Easy to identify which files are active/inactive

---

## 🔗 Related Features

- **Knowledge Base Page**: Upload files with website selector
- **File Upload API**: Stores files with website_id
- **AI Agent Service**: Filters files by website_id during RAG
- **Test Query Modal**: Tests RAG with uploaded files

---

## 📝 Notes

- Files are **automatically included** in RAG - no manual selection needed
- The AI agent already filters by website_id when searching files
- This display is **informational** - showing what's available
- Tenant-wide files (website_id = NULL) are available to all widgets
- Website-specific files are only shown to widgets on the same website

---

## ✅ Completion Checklist

- [x] Backend API endpoint created
- [x] Service layer method implemented
- [x] Route registered in main.go
- [x] Frontend interface defined
- [x] State management added
- [x] Data fetching function created
- [x] useEffect for auto-loading
- [x] UI component designed and implemented
- [x] Icons imported (FileText, Upload)
- [x] Loading state handled
- [x] Empty state handled
- [x] Error handling added
- [x] Backend built and deployed
- [x] Frontend built and deployed
- [x] Database verified
- [x] Documentation created

---

## 🎉 Result

Users can now see all uploaded files that are available for their chat widget's RAG system directly in the Chat Widget Designer. The interface is clean, informative, and helps users understand exactly what content their AI agent has access to.

**Access**: http://138.2.68.107 → Chat Widget Designer → AI Agent tab → Uploaded Files section
