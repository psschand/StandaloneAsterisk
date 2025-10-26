package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/chat"
	"gorm.io/gorm"
)

// ChatAgentRepository defines the interface for chat agent data access
type ChatAgentRepository interface {
	Create(ctx context.Context, agent *chat.ChatAgent) error
	FindByID(ctx context.Context, id int64) (*chat.ChatAgent, error)
	FindByUser(ctx context.Context, tenantID string, userID int64) (*chat.ChatAgent, error)
	FindByTenant(ctx context.Context, tenantID string) ([]chat.ChatAgent, error)
	Update(ctx context.Context, agent *chat.ChatAgent) error
	Delete(ctx context.Context, id int64) error
	FindAvailable(ctx context.Context, tenantID string) ([]chat.ChatAgent, error)
	FindByTeam(ctx context.Context, tenantID, team string) ([]chat.ChatAgent, error)
	UpdateAvailability(ctx context.Context, id int64, isAvailable bool) error
}

// chatAgentRepository implements ChatAgentRepository
type chatAgentRepository struct {
	db *gorm.DB
}

// NewChatAgentRepository creates a new chat agent repository
func NewChatAgentRepository(db *gorm.DB) ChatAgentRepository {
	return &chatAgentRepository{db: db}
}

// Create creates a new chat agent
func (r *chatAgentRepository) Create(ctx context.Context, agent *chat.ChatAgent) error {
	return r.db.WithContext(ctx).Create(agent).Error
}

// FindByID finds a chat agent by ID
func (r *chatAgentRepository) FindByID(ctx context.Context, id int64) (*chat.ChatAgent, error) {
	var agent chat.ChatAgent
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("id = ?", id).
		First(&agent).Error
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

// FindByUser finds a chat agent by user
func (r *chatAgentRepository) FindByUser(ctx context.Context, tenantID string, userID int64) (*chat.ChatAgent, error) {
	var agent chat.ChatAgent
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("tenant_id = ? AND user_id = ?", tenantID, userID).
		First(&agent).Error
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

// FindByTenant finds all chat agents for a tenant
func (r *chatAgentRepository) FindByTenant(ctx context.Context, tenantID string) ([]chat.ChatAgent, error) {
	var agents []chat.ChatAgent
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("tenant_id = ?", tenantID).
		Find(&agents).Error
	return agents, err
}

// Update updates a chat agent
func (r *chatAgentRepository) Update(ctx context.Context, agent *chat.ChatAgent) error {
	return r.db.WithContext(ctx).Save(agent).Error
}

// Delete deletes a chat agent
func (r *chatAgentRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&chat.ChatAgent{}).Error
}

// FindAvailable finds all available chat agents
func (r *chatAgentRepository) FindAvailable(ctx context.Context, tenantID string) ([]chat.ChatAgent, error) {
	var agents []chat.ChatAgent
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("tenant_id = ? AND is_available = ?", tenantID, true).
		Where("current_chats < max_concurrent_chats").
		Order("current_chats ASC").
		Find(&agents).Error
	return agents, err
}

// FindByTeam finds all chat agents in a specific team
func (r *chatAgentRepository) FindByTeam(ctx context.Context, tenantID, team string) ([]chat.ChatAgent, error) {
	var agents []chat.ChatAgent
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("tenant_id = ? AND team = ?", tenantID, team).
		Find(&agents).Error
	return agents, err
}

// UpdateAvailability updates an agent's availability status
func (r *chatAgentRepository) UpdateAvailability(ctx context.Context, id int64, isAvailable bool) error {
	return r.db.WithContext(ctx).
		Model(&chat.ChatAgent{}).
		Where("id = ?", id).
		Update("is_available", isAvailable).Error
}
