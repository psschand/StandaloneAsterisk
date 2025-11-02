package chat

import (
	"context"
	"encoding/csv"
	"fmt"
	"mime/multipart"
	"strings"
	"time"

	"gorm.io/gorm"
)

// KnowledgeBaseService handles knowledge base operations
type KnowledgeBaseService struct {
	db      *gorm.DB
	aiAgent *AIAgentService
}

// NewKnowledgeBaseService creates a new knowledge base service
func NewKnowledgeBaseService(db *gorm.DB, aiAgent *AIAgentService) *KnowledgeBaseService {
	return &KnowledgeBaseService{
		db:      db,
		aiAgent: aiAgent,
	}
}

// CreateKBRequest represents a request to create a knowledge base entry
type CreateKBRequest struct {
	TenantID    string `json:"tenant_id"`
	Category    string `json:"category" binding:"required"`
	Subcategory string `json:"subcategory"`
	Title       string `json:"title" binding:"required"`
	Question    string `json:"question" binding:"required"`
	Answer      string `json:"answer" binding:"required"`
	Keywords    string `json:"keywords"`
	Language    string `json:"language"`
	SourceURL   string `json:"source_url"`
	IsActive    bool   `json:"is_active"`
	IsPublic    bool   `json:"is_public"`
	Priority    int    `json:"priority"`
	CreatedBy   *int64 `json:"created_by"`
}

// UpdateKBRequest represents a request to update a knowledge base entry
type UpdateKBRequest struct {
	Category    *string `json:"category"`
	Subcategory *string `json:"subcategory"`
	Title       *string `json:"title"`
	Question    *string `json:"question"`
	Answer      *string `json:"answer"`
	Keywords    *string `json:"keywords"`
	Language    *string `json:"language"`
	SourceURL   *string `json:"source_url"`
	IsActive    *bool   `json:"is_active"`
	IsPublic    *bool   `json:"is_public"`
	Priority    *int    `json:"priority"`
	UpdatedBy   *int64  `json:"updated_by"`
}

// ListKBRequest represents a request to list knowledge base entries
type ListKBRequest struct {
	TenantID string `json:"tenant_id"`
	Category string `json:"category"`
	Search   string `json:"search"`
	Language string `json:"language"`
	IsActive *bool  `json:"is_active"`
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
}

// CreateEntry creates a new knowledge base entry
func (s *KnowledgeBaseService) CreateEntry(ctx context.Context, req *CreateKBRequest) (*KnowledgeBase, error) {
	entry := &KnowledgeBase{
		TenantID:    req.TenantID,
		Category:    req.Category,
		Subcategory: req.Subcategory,
		Title:       req.Title,
		Question:    req.Question,
		Answer:      req.Answer,
		Keywords:    req.Keywords,
		Language:    req.Language,
		SourceURL:   req.SourceURL,
		IsActive:    req.IsActive,
		IsPublic:    req.IsPublic,
		Priority:    req.Priority,
		CreatedBy:   req.CreatedBy,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if entry.Language == "" {
		entry.Language = "en"
	}

	if err := s.db.Create(entry).Error; err != nil {
		return nil, fmt.Errorf("failed to create knowledge base entry: %w", err)
	}

	return entry, nil
}

// GetEntry gets a single knowledge base entry
func (s *KnowledgeBaseService) GetEntry(ctx context.Context, id int64) (*KnowledgeBase, error) {
	var entry KnowledgeBase
	if err := s.db.First(&entry, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("knowledge base entry not found")
		}
		return nil, err
	}
	return &entry, nil
}

// ListEntries lists knowledge base entries
func (s *KnowledgeBaseService) ListEntries(ctx context.Context, req *ListKBRequest) ([]KnowledgeBase, int64, error) {
	query := s.db.Model(&KnowledgeBase{}).Where("tenant_id = ?", req.TenantID)

	// Apply filters
	if req.Category != "" {
		query = query.Where("category = ?", req.Category)
	}
	if req.Language != "" {
		query = query.Where("language = ?", req.Language)
	}
	if req.IsActive != nil {
		query = query.Where("is_active = ?", *req.IsActive)
	}
	if req.Search != "" {
		searchTerm := "%" + req.Search + "%"
		query = query.Where("title LIKE ? OR question LIKE ? OR answer LIKE ? OR keywords LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get entries
	var entries []KnowledgeBase
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("priority DESC, usage_count DESC, created_at DESC").
		Offset(offset).
		Limit(req.PageSize).
		Find(&entries).Error; err != nil {
		return nil, 0, err
	}

	return entries, total, nil
}

// UpdateEntry updates a knowledge base entry
func (s *KnowledgeBaseService) UpdateEntry(ctx context.Context, id int64, req *UpdateKBRequest) (*KnowledgeBase, error) {
	var entry KnowledgeBase
	if err := s.db.First(&entry, id).Error; err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})

	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.Subcategory != nil {
		updates["subcategory"] = *req.Subcategory
	}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Question != nil {
		updates["question"] = *req.Question
	}
	if req.Answer != nil {
		updates["answer"] = *req.Answer
	}
	if req.Keywords != nil {
		updates["keywords"] = *req.Keywords
	}
	if req.Language != nil {
		updates["language"] = *req.Language
	}
	if req.SourceURL != nil {
		updates["source_url"] = *req.SourceURL
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.IsPublic != nil {
		updates["is_public"] = *req.IsPublic
	}
	if req.Priority != nil {
		updates["priority"] = *req.Priority
	}
	if req.UpdatedBy != nil {
		updates["updated_by"] = *req.UpdatedBy
	}

	updates["updated_at"] = time.Now()

	if err := s.db.Model(&entry).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &entry, nil
}

// DeleteEntry deletes a knowledge base entry
func (s *KnowledgeBaseService) DeleteEntry(ctx context.Context, id int64) error {
	return s.db.Delete(&KnowledgeBase{}, id).Error
}

// SearchEntries searches knowledge base entries using full-text search
func (s *KnowledgeBaseService) SearchEntries(ctx context.Context, tenantID, query string, limit int) ([]KnowledgeBase, error) {
	var entries []KnowledgeBase

	err := s.db.Where("tenant_id = ? AND is_active = true", tenantID).
		Where("MATCH(question, answer, keywords) AGAINST(? IN NATURAL LANGUAGE MODE)", query).
		Order("priority DESC, usage_count DESC").
		Limit(limit).
		Find(&entries).Error

	return entries, err
}

// GetCategories gets all unique categories
func (s *KnowledgeBaseService) GetCategories(ctx context.Context, tenantID string) ([]CategoryStats, error) {
	var results []CategoryStats

	err := s.db.Model(&KnowledgeBase{}).
		Select("category, COUNT(*) as count").
		Where("tenant_id = ? AND is_active = true", tenantID).
		Group("category").
		Order("count DESC").
		Find(&results).Error

	return results, err
}

// CategoryStats represents category statistics
type CategoryStats struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

// TestQuery tests AI response using knowledge base
func (s *KnowledgeBaseService) TestQuery(ctx context.Context, tenantID, query string) (*TestQueryResult, error) {
	// Search knowledge base
	entries, err := s.SearchEntries(ctx, tenantID, query, 3)
	if err != nil {
		return nil, err
	}

	// Build context
	var contextBuilder strings.Builder
	var entryIDs []int64

	for i, entry := range entries {
		entryIDs = append(entryIDs, entry.ID)
		contextBuilder.WriteString(fmt.Sprintf("\n[KB %d]\nQuestion: %s\nAnswer: %s\n",
			i+1, entry.Question, entry.Answer))
	}

	result := &TestQueryResult{
		Query:          query,
		MatchedEntries: entries,
		Context:        contextBuilder.String(),
		Confidence:     s.calculateMatchConfidence(entries, query),
	}

	// If AI agent available, get AI response
	if s.aiAgent != nil {
		// Note: In real implementation, create a test conversation
		// For now, just show matched entries
	}

	return result, nil
}

// TestQueryResult represents the result of a test query
type TestQueryResult struct {
	Query          string          `json:"query"`
	MatchedEntries []KnowledgeBase `json:"matched_entries"`
	Context        string          `json:"context"`
	Confidence     float64         `json:"confidence"`
	AIResponse     string          `json:"ai_response,omitempty"`
}

// calculateMatchConfidence calculates how well entries match the query
func (s *KnowledgeBaseService) calculateMatchConfidence(entries []KnowledgeBase, query string) float64 {
	if len(entries) == 0 {
		return 0.0
	}

	// Simple scoring: more entries = higher confidence
	confidence := float64(len(entries)) * 0.3
	if confidence > 1.0 {
		confidence = 1.0
	}

	return confidence
}

// MarkHelpful marks a knowledge base entry as helpful or not
func (s *KnowledgeBaseService) MarkHelpful(ctx context.Context, id int64, isHelpful bool) error {
	field := "helpful_count"
	if !isHelpful {
		field = "not_helpful_count"
	}

	return s.db.Model(&KnowledgeBase{}).
		Where("id = ?", id).
		Update(field, gorm.Expr(field+" + 1")).Error
}

// BulkImport imports multiple knowledge base entries
func (s *KnowledgeBaseService) BulkImport(ctx context.Context, entries []CreateKBRequest) (int, error) {
	count := 0

	for _, req := range entries {
		if _, err := s.CreateEntry(ctx, &req); err != nil {
			// Log error but continue
			fmt.Printf("Failed to import entry %s: %v\n", req.Title, err)
			continue
		}
		count++
	}

	return count, nil
}

// ExportToCSV exports knowledge base entries to CSV
func (s *KnowledgeBaseService) ExportToCSV(ctx context.Context, tenantID, category string) (string, error) {
	query := s.db.Model(&KnowledgeBase{}).Where("tenant_id = ?", tenantID)

	if category != "" {
		query = query.Where("category = ?", category)
	}

	var entries []KnowledgeBase
	if err := query.Find(&entries).Error; err != nil {
		return "", err
	}

	// Build CSV
	var builder strings.Builder
	writer := csv.NewWriter(&builder)

	// Write header
	writer.Write([]string{
		"ID", "Category", "Subcategory", "Title", "Question", "Answer",
		"Keywords", "Language", "Source URL", "Usage Count", "Helpful Count",
		"Not Helpful Count", "Priority", "Is Active", "Is Public",
	})

	// Write data
	for _, entry := range entries {
		writer.Write([]string{
			fmt.Sprintf("%d", entry.ID),
			entry.Category,
			entry.Subcategory,
			entry.Title,
			entry.Question,
			entry.Answer,
			entry.Keywords,
			entry.Language,
			entry.SourceURL,
			fmt.Sprintf("%d", entry.UsageCount),
			fmt.Sprintf("%d", entry.HelpfulCount),
			fmt.Sprintf("%d", entry.NotHelpfulCount),
			fmt.Sprintf("%d", entry.Priority),
			fmt.Sprintf("%t", entry.IsActive),
			fmt.Sprintf("%t", entry.IsPublic),
		})
	}

	writer.Flush()
	return builder.String(), nil
}

// GetStats gets knowledge base statistics
func (s *KnowledgeBaseService) GetStats(ctx context.Context, tenantID string) (*KBStats, error) {
	var stats KBStats

	// Total entries
	s.db.Model(&KnowledgeBase{}).
		Where("tenant_id = ?", tenantID).
		Count(&stats.TotalEntries)

	// Active entries
	s.db.Model(&KnowledgeBase{}).
		Where("tenant_id = ? AND is_active = true", tenantID).
		Count(&stats.ActiveEntries)

	// By category
	s.db.Model(&KnowledgeBase{}).
		Select("category, COUNT(*) as count").
		Where("tenant_id = ?", tenantID).
		Group("category").
		Find(&stats.ByCategory)

	// Most used
	s.db.Model(&KnowledgeBase{}).
		Where("tenant_id = ? AND usage_count > 0", tenantID).
		Order("usage_count DESC").
		Limit(10).
		Find(&stats.MostUsed)

	// Total usage
	s.db.Model(&KnowledgeBase{}).
		Select("SUM(usage_count) as total_usage").
		Where("tenant_id = ?", tenantID).
		Scan(&stats.TotalUsage)

	return &stats, nil
}

// KBStats represents knowledge base statistics
type KBStats struct {
	TotalEntries  int64           `json:"total_entries"`
	ActiveEntries int64           `json:"active_entries"`
	ByCategory    []CategoryStats `json:"by_category"`
	MostUsed      []KnowledgeBase `json:"most_used"`
	TotalUsage    int             `json:"total_usage"`
}

// ProcessDocument processes uploaded document and creates KB entries
func (s *KnowledgeBaseService) ProcessDocument(ctx context.Context, file interface{}, req *UploadDocumentRequest, userID int64) (*UploadDocumentResponse, error) {
	// Create document upload service
	docService := NewDocumentUploadService(s.db, s)

	// Type assert to multipart.FileHeader
	fileHeader, ok := file.(*multipart.FileHeader)
	if !ok {
		return nil, fmt.Errorf("invalid file type")
	}

	// Process the document
	return docService.ProcessDocument(ctx, fileHeader, req)
}
