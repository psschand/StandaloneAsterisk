package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/common"
	"gorm.io/gorm"
)

// AgentStateRepository defines the interface for agent state data access
type AgentStateRepository interface {
	Create(ctx context.Context, state *asterisk.AgentState) error
	FindByID(ctx context.Context, id int64) (*asterisk.AgentState, error)
	FindByUser(ctx context.Context, tenantID string, userID int64) (*asterisk.AgentState, error)
	FindByTenant(ctx context.Context, tenantID string) ([]asterisk.AgentState, error)
	Update(ctx context.Context, state *asterisk.AgentState) error
	UpdateState(ctx context.Context, id int64, state common.AgentStatus, reason *string) error
	FindByState(ctx context.Context, tenantID string, state common.AgentStatus) ([]asterisk.AgentState, error)
	FindAvailableAgents(ctx context.Context, tenantID string) ([]asterisk.AgentState, error)
}

// agentStateRepository implements AgentStateRepository
type agentStateRepository struct {
	db *gorm.DB
}

// NewAgentStateRepository creates a new agent state repository
func NewAgentStateRepository(db *gorm.DB) AgentStateRepository {
	return &agentStateRepository{db: db}
}

// Create creates a new agent state
func (r *agentStateRepository) Create(ctx context.Context, state *asterisk.AgentState) error {
	return r.db.WithContext(ctx).Create(state).Error
}

// FindByID finds an agent state by ID
func (r *agentStateRepository) FindByID(ctx context.Context, id int64) (*asterisk.AgentState, error) {
	var state asterisk.AgentState
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&state).Error
	if err != nil {
		return nil, err
	}
	return &state, nil
}

// FindByUser finds an agent state by user
func (r *agentStateRepository) FindByUser(ctx context.Context, tenantID string, userID int64) (*asterisk.AgentState, error) {
	var state asterisk.AgentState
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND user_id = ?", tenantID, userID).
		First(&state).Error
	if err != nil {
		return nil, err
	}
	return &state, nil
}

// FindByTenant finds all agent states for a tenant
func (r *agentStateRepository) FindByTenant(ctx context.Context, tenantID string) ([]asterisk.AgentState, error) {
	var states []asterisk.AgentState
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("tenant_id = ?", tenantID).
		Find(&states).Error
	return states, err
}

// Update updates an agent state
func (r *agentStateRepository) Update(ctx context.Context, state *asterisk.AgentState) error {
	return r.db.WithContext(ctx).Save(state).Error
}

// UpdateState updates only the state and reason
func (r *agentStateRepository) UpdateState(ctx context.Context, id int64, state common.AgentStatus, reason *string) error {
	updates := map[string]interface{}{
		"state": state,
	}
	if reason != nil {
		updates["reason"] = *reason
	}
	return r.db.WithContext(ctx).
		Model(&asterisk.AgentState{}).
		Where("id = ?", id).
		Updates(updates).Error
}

// FindByState finds all agents with a specific state
func (r *agentStateRepository) FindByState(ctx context.Context, tenantID string, state common.AgentStatus) ([]asterisk.AgentState, error) {
	var states []asterisk.AgentState
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("tenant_id = ? AND state = ?", tenantID, state).
		Find(&states).Error
	return states, err
}

// FindAvailableAgents finds all available agents
func (r *agentStateRepository) FindAvailableAgents(ctx context.Context, tenantID string) ([]asterisk.AgentState, error) {
	var states []asterisk.AgentState
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("tenant_id = ? AND state = ?", tenantID, common.AgentStatusAvailable).
		Find(&states).Error
	return states, err
}
