package repository

import (
	"context"
	"time"

	"github.com/psschand/callcenter/internal/chat"
	"github.com/psschand/callcenter/internal/common"
	"gorm.io/gorm"
)

// ChatSessionRepository defines the interface for chat session data access
type ChatSessionRepository interface {
	Create(ctx context.Context, session *chat.ChatSession) error
	FindByID(ctx context.Context, id int64) (*chat.ChatSession, error)
	FindByKey(ctx context.Context, sessionKey string) (*chat.ChatSession, error)
	FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]chat.ChatSession, int64, error)
	FindByStatus(ctx context.Context, tenantID string, status common.ChatSessionStatus) ([]chat.ChatSession, error)
	FindByAssignee(ctx context.Context, assigneeID int64) ([]chat.ChatSession, error)
	FindActiveByTenant(ctx context.Context, tenantID string) ([]chat.ChatSession, error)
	Update(ctx context.Context, session *chat.ChatSession) error
	Delete(ctx context.Context, id int64) error
	FindWithMessages(ctx context.Context, id int64) (*chat.ChatSession, error)
	GetStats(ctx context.Context, tenantID string, start, end time.Time) (map[string]interface{}, error)
}

// chatSessionRepository implements ChatSessionRepository
type chatSessionRepository struct {
	db *gorm.DB
}

// NewChatSessionRepository creates a new chat session repository
func NewChatSessionRepository(db *gorm.DB) ChatSessionRepository {
	return &chatSessionRepository{db: db}
}

// Create creates a new chat session
func (r *chatSessionRepository) Create(ctx context.Context, session *chat.ChatSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

// FindByID finds a chat session by ID
func (r *chatSessionRepository) FindByID(ctx context.Context, id int64) (*chat.ChatSession, error) {
	var session chat.ChatSession
	err := r.db.WithContext(ctx).
		Preload("Widget").
		Preload("AssignedTo").
		Where("id = ?", id).
		First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// FindByKey finds a chat session by session key
func (r *chatSessionRepository) FindByKey(ctx context.Context, sessionKey string) (*chat.ChatSession, error) {
	var session chat.ChatSession
	err := r.db.WithContext(ctx).
		Preload("Widget").
		Preload("AssignedTo").
		Where("session_key = ?", sessionKey).
		First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// FindByTenant finds all chat sessions for a tenant with pagination
func (r *chatSessionRepository) FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]chat.ChatSession, int64, error) {
	var sessions []chat.ChatSession
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&chat.ChatSession{}).Where("tenant_id = ?", tenantID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Preload("Widget").
		Preload("AssignedTo").
		Where("tenant_id = ?", tenantID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&sessions).Error

	return sessions, total, err
}

// FindByStatus finds chat sessions by status
func (r *chatSessionRepository) FindByStatus(ctx context.Context, tenantID string, status common.ChatSessionStatus) ([]chat.ChatSession, error) {
	var sessions []chat.ChatSession
	err := r.db.WithContext(ctx).
		Preload("Widget").
		Preload("AssignedTo").
		Where("tenant_id = ? AND status = ?", tenantID, status).
		Order("created_at DESC").
		Find(&sessions).Error
	return sessions, err
}

// FindByAssignee finds chat sessions assigned to a user
func (r *chatSessionRepository) FindByAssignee(ctx context.Context, assigneeID int64) ([]chat.ChatSession, error) {
	var sessions []chat.ChatSession
	err := r.db.WithContext(ctx).
		Preload("Widget").
		Where("assigned_to_id = ? AND status = ?", assigneeID, common.ChatSessionStatusActive).
		Order("created_at DESC").
		Find(&sessions).Error
	return sessions, err
}

// FindActiveByTenant finds all active chat sessions for a tenant
func (r *chatSessionRepository) FindActiveByTenant(ctx context.Context, tenantID string) ([]chat.ChatSession, error) {
	var sessions []chat.ChatSession
	err := r.db.WithContext(ctx).
		Preload("AssignedTo").
		Where("tenant_id = ? AND status = ?", tenantID, common.ChatSessionStatusActive).
		Order("created_at DESC").
		Find(&sessions).Error
	return sessions, err
}

// Update updates a chat session
func (r *chatSessionRepository) Update(ctx context.Context, session *chat.ChatSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

// Delete deletes a chat session
func (r *chatSessionRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&chat.ChatSession{}).Error
}

// FindWithMessages finds a chat session with messages preloaded
func (r *chatSessionRepository) FindWithMessages(ctx context.Context, id int64) (*chat.ChatSession, error) {
	var session chat.ChatSession
	err := r.db.WithContext(ctx).
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		Preload("Widget").
		Preload("AssignedTo").
		Where("id = ?", id).
		First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// GetStats returns chat statistics
func (r *chatSessionRepository) GetStats(ctx context.Context, tenantID string, start, end time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total sessions
	var totalSessions int64
	if err := r.db.WithContext(ctx).
		Model(&chat.ChatSession{}).
		Where("tenant_id = ? AND created_at BETWEEN ? AND ?", tenantID, start, end).
		Count(&totalSessions).Error; err != nil {
		return nil, err
	}
	stats["total_sessions"] = totalSessions

	// Sessions by status
	statusCounts := make(map[string]int64)
	statuses := []common.ChatSessionStatus{
		common.ChatSessionStatusActive,
		common.ChatSessionStatusQueued,
		common.ChatSessionStatusEnded,
		common.ChatSessionStatusAbandoned,
	}

	for _, status := range statuses {
		var count int64
		if err := r.db.WithContext(ctx).
			Model(&chat.ChatSession{}).
			Where("tenant_id = ? AND status = ?", tenantID, status).
			Count(&count).Error; err != nil {
			return nil, err
		}
		statusCounts[string(status)] = count
	}
	stats["by_status"] = statusCounts

	// Average duration
	var avgDuration float64
	if err := r.db.WithContext(ctx).
		Model(&chat.ChatSession{}).
		Where("tenant_id = ? AND duration IS NOT NULL", tenantID).
		Select("AVG(duration)").
		Scan(&avgDuration).Error; err != nil {
		return nil, err
	}
	stats["avg_duration_seconds"] = avgDuration

	// Average first response time
	var avgResponseTime float64
	if err := r.db.WithContext(ctx).
		Model(&chat.ChatSession{}).
		Where("tenant_id = ? AND first_response_time IS NOT NULL", tenantID).
		Select("AVG(first_response_time)").
		Scan(&avgResponseTime).Error; err != nil {
		return nil, err
	}
	stats["avg_first_response_time_seconds"] = avgResponseTime

	// Average rating
	var avgRating float64
	if err := r.db.WithContext(ctx).
		Model(&chat.ChatSession{}).
		Where("tenant_id = ? AND rating IS NOT NULL", tenantID).
		Select("AVG(rating)").
		Scan(&avgRating).Error; err != nil {
		return nil, err
	}
	stats["avg_rating"] = avgRating

	return stats, nil
}
