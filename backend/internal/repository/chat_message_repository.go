package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/chat"
	"gorm.io/gorm"
)

// ChatMessageRepository defines the interface for chat message data access
type ChatMessageRepository interface {
	Create(ctx context.Context, message *chat.ChatMessage) error
	FindByID(ctx context.Context, id int64) (*chat.ChatMessage, error)
	FindBySession(ctx context.Context, sessionID int64, page, pageSize int) ([]chat.ChatMessage, int64, error)
	Update(ctx context.Context, message *chat.ChatMessage) error
	Delete(ctx context.Context, id int64) error
	MarkAsRead(ctx context.Context, messageID int64) error
	CountUnreadBySession(ctx context.Context, sessionID int64) (int64, error)
}

// chatMessageRepository implements ChatMessageRepository
type chatMessageRepository struct {
	db *gorm.DB
}

// NewChatMessageRepository creates a new chat message repository
func NewChatMessageRepository(db *gorm.DB) ChatMessageRepository {
	return &chatMessageRepository{db: db}
}

// Create creates a new chat message
func (r *chatMessageRepository) Create(ctx context.Context, message *chat.ChatMessage) error {
	return r.db.WithContext(ctx).Create(message).Error
}

// FindByID finds a chat message by ID
func (r *chatMessageRepository) FindByID(ctx context.Context, id int64) (*chat.ChatMessage, error) {
	var message chat.ChatMessage
	err := r.db.WithContext(ctx).
		Preload("Sender").
		Where("id = ?", id).
		First(&message).Error
	if err != nil {
		return nil, err
	}
	return &message, nil
}

// FindBySession finds all messages for a chat session with pagination
func (r *chatMessageRepository) FindBySession(ctx context.Context, sessionID int64, page, pageSize int) ([]chat.ChatMessage, int64, error) {
	var messages []chat.ChatMessage
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&chat.ChatMessage{}).Where("session_id = ?", sessionID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Preload("Sender").
		Where("session_id = ?", sessionID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at ASC").
		Find(&messages).Error

	return messages, total, err
}

// Update updates a chat message
func (r *chatMessageRepository) Update(ctx context.Context, message *chat.ChatMessage) error {
	return r.db.WithContext(ctx).Save(message).Error
}

// Delete deletes a chat message
func (r *chatMessageRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&chat.ChatMessage{}).Error
}

// MarkAsRead marks a message as read
func (r *chatMessageRepository) MarkAsRead(ctx context.Context, messageID int64) error {
	return r.db.WithContext(ctx).
		Model(&chat.ChatMessage{}).
		Where("id = ?", messageID).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": gorm.Expr("NOW()"),
		}).Error
}

// CountUnreadBySession counts unread messages in a session
func (r *chatMessageRepository) CountUnreadBySession(ctx context.Context, sessionID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&chat.ChatMessage{}).
		Where("session_id = ? AND is_read = ?", sessionID, false).
		Count(&count).Error
	return count, err
}
