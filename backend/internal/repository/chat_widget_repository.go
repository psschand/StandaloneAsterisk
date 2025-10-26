package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/chat"
	"gorm.io/gorm"
)

// ChatWidgetRepository defines the interface for chat widget data access
type ChatWidgetRepository interface {
	Create(ctx context.Context, widget *chat.ChatWidget) error
	FindByID(ctx context.Context, id int64) (*chat.ChatWidget, error)
	FindByKey(ctx context.Context, widgetKey string) (*chat.ChatWidget, error)
	FindByTenant(ctx context.Context, tenantID string) ([]chat.ChatWidget, error)
	Update(ctx context.Context, widget *chat.ChatWidget) error
	Delete(ctx context.Context, id int64) error
	FindEnabled(ctx context.Context, tenantID string) ([]chat.ChatWidget, error)
}

// chatWidgetRepository implements ChatWidgetRepository
type chatWidgetRepository struct {
	db *gorm.DB
}

// NewChatWidgetRepository creates a new chat widget repository
func NewChatWidgetRepository(db *gorm.DB) ChatWidgetRepository {
	return &chatWidgetRepository{db: db}
}

// Create creates a new chat widget
func (r *chatWidgetRepository) Create(ctx context.Context, widget *chat.ChatWidget) error {
	return r.db.WithContext(ctx).Create(widget).Error
}

// FindByID finds a chat widget by ID
func (r *chatWidgetRepository) FindByID(ctx context.Context, id int64) (*chat.ChatWidget, error) {
	var widget chat.ChatWidget
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&widget).Error
	if err != nil {
		return nil, err
	}
	return &widget, nil
}

// FindByKey finds a chat widget by widget key
func (r *chatWidgetRepository) FindByKey(ctx context.Context, widgetKey string) (*chat.ChatWidget, error) {
	var widget chat.ChatWidget
	err := r.db.WithContext(ctx).Where("widget_key = ?", widgetKey).First(&widget).Error
	if err != nil {
		return nil, err
	}
	return &widget, nil
}

// FindByTenant finds all chat widgets for a tenant
func (r *chatWidgetRepository) FindByTenant(ctx context.Context, tenantID string) ([]chat.ChatWidget, error) {
	var widgets []chat.ChatWidget
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&widgets).Error
	return widgets, err
}

// Update updates a chat widget
func (r *chatWidgetRepository) Update(ctx context.Context, widget *chat.ChatWidget) error {
	return r.db.WithContext(ctx).Save(widget).Error
}

// Delete deletes a chat widget
func (r *chatWidgetRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&chat.ChatWidget{}).Error
}

// FindEnabled finds all enabled chat widgets for a tenant
func (r *chatWidgetRepository) FindEnabled(ctx context.Context, tenantID string) ([]chat.ChatWidget, error) {
	var widgets []chat.ChatWidget
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND is_enabled = ?", tenantID, true).
		Find(&widgets).Error
	return widgets, err
}
