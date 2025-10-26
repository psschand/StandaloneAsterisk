package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/chat"
	"gorm.io/gorm"
)

// ChatTransferRepository defines the interface for chat transfer data access
type ChatTransferRepository interface {
	Create(ctx context.Context, transfer *chat.ChatTransfer) error
	FindByID(ctx context.Context, id int64) (*chat.ChatTransfer, error)
	FindBySession(ctx context.Context, sessionID int64) ([]chat.ChatTransfer, error)
	FindPending(ctx context.Context, tenantID string) ([]chat.ChatTransfer, error)
	Update(ctx context.Context, transfer *chat.ChatTransfer) error
	Delete(ctx context.Context, id int64) error
}

// chatTransferRepository implements ChatTransferRepository
type chatTransferRepository struct {
	db *gorm.DB
}

// NewChatTransferRepository creates a new chat transfer repository
func NewChatTransferRepository(db *gorm.DB) ChatTransferRepository {
	return &chatTransferRepository{db: db}
}

// Create creates a new chat transfer
func (r *chatTransferRepository) Create(ctx context.Context, transfer *chat.ChatTransfer) error {
	return r.db.WithContext(ctx).Create(transfer).Error
}

// FindByID finds a chat transfer by ID
func (r *chatTransferRepository) FindByID(ctx context.Context, id int64) (*chat.ChatTransfer, error) {
	var transfer chat.ChatTransfer
	err := r.db.WithContext(ctx).
		Preload("Session").
		Preload("FromAgent").
		Preload("ToAgent").
		Where("id = ?", id).
		First(&transfer).Error
	if err != nil {
		return nil, err
	}
	return &transfer, nil
}

// FindBySession finds all transfers for a session
func (r *chatTransferRepository) FindBySession(ctx context.Context, sessionID int64) ([]chat.ChatTransfer, error) {
	var transfers []chat.ChatTransfer
	err := r.db.WithContext(ctx).
		Preload("FromAgent").
		Preload("ToAgent").
		Where("session_id = ?", sessionID).
		Order("created_at DESC").
		Find(&transfers).Error
	return transfers, err
}

// FindPending finds all pending transfers
func (r *chatTransferRepository) FindPending(ctx context.Context, tenantID string) ([]chat.ChatTransfer, error) {
	var transfers []chat.ChatTransfer
	err := r.db.WithContext(ctx).
		Preload("Session").
		Preload("FromAgent").
		Preload("ToAgent").
		Joins("JOIN chat_sessions ON chat_sessions.id = chat_transfers.session_id").
		Where("chat_sessions.tenant_id = ? AND chat_transfers.accepted_at IS NULL", tenantID).
		Order("chat_transfers.created_at ASC").
		Find(&transfers).Error
	return transfers, err
}

// Update updates a chat transfer
func (r *chatTransferRepository) Update(ctx context.Context, transfer *chat.ChatTransfer) error {
	return r.db.WithContext(ctx).Save(transfer).Error
}

// Delete deletes a chat transfer
func (r *chatTransferRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&chat.ChatTransfer{}).Error
}
