package service

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
)

// AgentStateService handles agent state operations
type AgentStateService interface {
	GetState(ctx context.Context, tenantID string, userID int64) (*dto.AgentStateResponse, error)
	UpdateState(ctx context.Context, tenantID string, userID int64, state common.AgentState, reason string) error
	GetByTenant(ctx context.Context, tenantID string) ([]dto.AgentStateResponse, error)
	GetAvailableAgents(ctx context.Context, tenantID string) ([]dto.AgentStateResponse, error)
	GetAgentsByState(ctx context.Context, tenantID string, state common.AgentState) ([]dto.AgentStateResponse, error)
	StartBreak(ctx context.Context, tenantID string, userID int64, reason string) error
	EndBreak(ctx context.Context, tenantID string, userID int64) error
	SetAway(ctx context.Context, tenantID string, userID int64, reason string) error
	SetAvailable(ctx context.Context, tenantID string, userID int64) error
}

type agentStateService struct {
	agentStateRepo repository.AgentStateRepository
	userRepo       repository.UserRepository
}

// NewAgentStateService creates a new agent state service
func NewAgentStateService(
	agentStateRepo repository.AgentStateRepository,
	userRepo repository.UserRepository,
) AgentStateService {
	return &agentStateService{
		agentStateRepo: agentStateRepo,
		userRepo:       userRepo,
	}
}

// GetState gets agent state for a user
func (s *agentStateService) GetState(ctx context.Context, tenantID string, userID int64) (*dto.AgentStateResponse, error) {
	state, err := s.agentStateRepo.FindByUser(ctx, tenantID, userID)
	if err != nil {
		// If no state exists, create default one
		reasonStr := "Initial state"
		defaultState := &asterisk.AgentState{
			TenantID: tenantID,
			UserID:   userID,
			State:    common.AgentStateOffline,
			Reason:   &reasonStr,
		}

		if err := s.agentStateRepo.Create(ctx, defaultState); err != nil {
			return nil, errors.Wrap(err, "failed to create default state")
		}

		return s.toAgentStateResponse(defaultState), nil
	}

	return s.toAgentStateResponse(state), nil
}

// UpdateState updates agent state
func (s *agentStateService) UpdateState(ctx context.Context, tenantID string, userID int64, state common.AgentState, reason string) error {
	// Get existing state or create new one
	existingState, err := s.agentStateRepo.FindByUser(ctx, tenantID, userID)
	if err != nil {
		// Create new state
		reasonPtr := &reason
		if reason == "" {
			reasonPtr = nil
		}

		newState := &asterisk.AgentState{
			TenantID: tenantID,
			UserID:   userID,
			State:    state,
			Reason:   reasonPtr,
		}

		return s.agentStateRepo.Create(ctx, newState)
	}

	// Update existing state
	reasonPtr := &reason
	if reason == "" {
		reasonPtr = nil
	}
	return s.agentStateRepo.UpdateState(ctx, existingState.ID, state, reasonPtr)
}

// GetByTenant gets all agent states for a tenant
func (s *agentStateService) GetByTenant(ctx context.Context, tenantID string) ([]dto.AgentStateResponse, error) {
	states, err := s.agentStateRepo.FindByTenant(ctx, tenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get agent states")
	}

	responses := make([]dto.AgentStateResponse, len(states))
	for i, state := range states {
		responses[i] = *s.toAgentStateResponse(&state)
	}

	return responses, nil
}

// GetAvailableAgents gets all available agents
func (s *agentStateService) GetAvailableAgents(ctx context.Context, tenantID string) ([]dto.AgentStateResponse, error) {
	states, err := s.agentStateRepo.FindAvailableAgents(ctx, tenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get available agents")
	}

	responses := make([]dto.AgentStateResponse, len(states))
	for i, state := range states {
		responses[i] = *s.toAgentStateResponse(&state)
	}

	return responses, nil
}

// GetAgentsByState gets agents by specific state
func (s *agentStateService) GetAgentsByState(ctx context.Context, tenantID string, state common.AgentState) ([]dto.AgentStateResponse, error) {
	states, err := s.agentStateRepo.FindByState(ctx, tenantID, state)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get agents by state")
	}

	responses := make([]dto.AgentStateResponse, len(states))
	for i, st := range states {
		responses[i] = *s.toAgentStateResponse(&st)
	}

	return responses, nil
}

// StartBreak starts an agent break
func (s *agentStateService) StartBreak(ctx context.Context, tenantID string, userID int64, reason string) error {
	if reason == "" {
		reason = "Break"
	}
	return s.UpdateState(ctx, tenantID, userID, common.AgentStateBreak, reason)
}

// EndBreak ends an agent break and sets to available
func (s *agentStateService) EndBreak(ctx context.Context, tenantID string, userID int64) error {
	return s.UpdateState(ctx, tenantID, userID, common.AgentStateAvailable, "Break ended")
}

// SetAway sets agent as away
func (s *agentStateService) SetAway(ctx context.Context, tenantID string, userID int64, reason string) error {
	if reason == "" {
		reason = "Away"
	}
	return s.UpdateState(ctx, tenantID, userID, common.AgentStateAway, reason)
}

// SetAvailable sets agent as available
func (s *agentStateService) SetAvailable(ctx context.Context, tenantID string, userID int64) error {
	return s.UpdateState(ctx, tenantID, userID, common.AgentStateAvailable, "Available")
}

// toAgentStateResponse converts AgentState model to response DTO
func (s *agentStateService) toAgentStateResponse(state *asterisk.AgentState) *dto.AgentStateResponse {
	return &dto.AgentStateResponse{
		ID:         state.ID,
		TenantID:   state.TenantID,
		UserID:     state.UserID,
		EndpointID: state.EndpointID,
		State:      state.State,
		Reason:     state.Reason,
		ChangedAt:  state.ChangedAt,
	}
}
