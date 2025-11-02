package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/chat"
	"github.com/psschand/callcenter/pkg/response"
)

// KnowledgeBaseHandler handles knowledge base requests
type KnowledgeBaseHandler struct {
	service *chat.KnowledgeBaseService
}

// NewKnowledgeBaseHandler creates a new knowledge base handler
func NewKnowledgeBaseHandler(service *chat.KnowledgeBaseService) *KnowledgeBaseHandler {
	return &KnowledgeBaseHandler{
		service: service,
	}
}

// CreateEntry creates a new knowledge base entry
func (h *KnowledgeBaseHandler) CreateEntry(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	var req chat.CreateKBRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	req.TenantID = tenantID
	req.CreatedBy = &userID

	entry, err := h.service.CreateEntry(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, entry)
}

// GetEntry gets a single knowledge base entry
func (h *KnowledgeBaseHandler) GetEntry(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid entry ID"})
		return
	}

	entry, err := h.service.GetEntry(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, entry)
}

// ListEntries lists all knowledge base entries
func (h *KnowledgeBaseHandler) ListEntries(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	req := &chat.ListKBRequest{
		TenantID: tenantID,
		Category: c.Query("category"),
		Search:   c.Query("search"),
		Language: c.Query("language"),
		Page:     page,
		PageSize: pageSize,
	}

	// Parse is_active filter
	if activeStr := c.Query("is_active"); activeStr != "" {
		isActive := activeStr == "true"
		req.IsActive = &isActive
	}

	entries, total, err := h.service.ListEntries(c.Request.Context(), req)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, entries, meta)
}

// UpdateEntry updates a knowledge base entry
func (h *KnowledgeBaseHandler) UpdateEntry(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid entry ID"})
		return
	}

	userID := c.GetInt64("user_id")

	var req chat.UpdateKBRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	req.UpdatedBy = &userID

	entry, err := h.service.UpdateEntry(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, entry)
}

// DeleteEntry deletes a knowledge base entry
func (h *KnowledgeBaseHandler) DeleteEntry(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid entry ID"})
		return
	}

	if err := h.service.DeleteEntry(c.Request.Context(), id); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// SearchEntries searches knowledge base entries
func (h *KnowledgeBaseHandler) SearchEntries(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	query := c.Query("q")

	if query == "" {
		response.ValidationError(c, map[string]string{"q": "search query is required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	entries, err := h.service.SearchEntries(c.Request.Context(), tenantID, query, limit)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, entries)
}

// GetCategories gets all knowledge base categories
func (h *KnowledgeBaseHandler) GetCategories(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	categories, err := h.service.GetCategories(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, categories)
}

// TestQuery tests AI response with knowledge base
func (h *KnowledgeBaseHandler) TestQuery(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req struct {
		Query string `json:"query" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.service.TestQuery(c.Request.Context(), tenantID, req.Query)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// MarkHelpful marks a knowledge base entry as helpful
func (h *KnowledgeBaseHandler) MarkHelpful(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid entry ID"})
		return
	}

	var req struct {
		IsHelpful bool `json:"is_helpful"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.service.MarkHelpful(c.Request.Context(), id, req.IsHelpful); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, gin.H{"message": "Feedback recorded"})
}

// BulkImport imports multiple knowledge base entries
func (h *KnowledgeBaseHandler) BulkImport(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	var req struct {
		Entries []chat.CreateKBRequest `json:"entries" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	// Set tenant and user for all entries
	for i := range req.Entries {
		req.Entries[i].TenantID = tenantID
		req.Entries[i].CreatedBy = &userID
	}

	count, err := h.service.BulkImport(c.Request.Context(), req.Entries)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, gin.H{
		"message": "Import completed",
		"count":   count,
	})
}

// Export exports knowledge base entries as CSV
func (h *KnowledgeBaseHandler) Export(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	category := c.Query("category")

	csvData, err := h.service.ExportToCSV(c.Request.Context(), tenantID, category)
	if err != nil {
		response.Error(c, err)
		return
	}

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=knowledge_base.csv")
	c.String(http.StatusOK, csvData)
}

// GetStats gets knowledge base statistics
func (h *KnowledgeBaseHandler) GetStats(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	stats, err := h.service.GetStats(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, stats)
}

// UploadDocument uploads and processes document (PDF/DOCX/TXT)
func (h *KnowledgeBaseHandler) UploadDocument(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	// Parse multipart form
	file, err := c.FormFile("file")
	if err != nil {
		response.ValidationError(c, map[string]string{"file": "file is required"})
		return
	}

	// Get form parameters
	category := c.PostForm("category")
	if category == "" {
		category = "General"
	}

	language := c.DefaultPostForm("language", "en")
	priority, _ := strconv.Atoi(c.DefaultPostForm("priority", "5"))

	req := &chat.UploadDocumentRequest{
		TenantID: tenantID,
		Category: category,
		Language: language,
		Priority: priority,
	}

	// Process document (this will be implemented in document service)
	result, err := h.service.ProcessDocument(c.Request.Context(), file, req, userID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}
