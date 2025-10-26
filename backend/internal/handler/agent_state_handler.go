package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// AgentStateHandler handles agent state requests
type AgentStateHandler struct {
	agentStateService service.AgentStateService
}

// NewAgentStateHandler creates a new agent state handler
func NewAgentStateHandler(agentStateService service.AgentStateService) *AgentStateHandler {
	return &AgentStateHandler{
		agentStateService: agentStateService,
	}
}

// Get gets agent state for a user
func (h *AgentStateHandler) Get(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"userId": "invalid user ID"})
		return
	}

	result, err := h.agentStateService.GetState(c.Request.Context(), tenantID, userID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// GetMyState gets current user's agent state
func (h *AgentStateHandler) GetMyState(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	result, err := h.agentStateService.GetState(c.Request.Context(), tenantID, userID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// UpdateState updates agent state
func (h *AgentStateHandler) UpdateState(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	var req struct {
		State  common.AgentState `json:"state" binding:"required"`
		Reason string            `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.agentStateService.UpdateState(c.Request.Context(), tenantID, userID, req.State, req.Reason); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// List lists all agent states for the current tenant
func (h *AgentStateHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	states, err := h.agentStateService.GetByTenant(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, states)
}

// GetAvailable gets available agents
func (h *AgentStateHandler) GetAvailable(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	agents, err := h.agentStateService.GetAvailableAgents(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, agents)
}

// GetByState gets agents by specific state
func (h *AgentStateHandler) GetByState(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	state := common.AgentState(c.Param("state"))

	agents, err := h.agentStateService.GetAgentsByState(c.Request.Context(), tenantID, state)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, agents)
}

// StartBreak starts an agent break
func (h *AgentStateHandler) StartBreak(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := h.agentStateService.StartBreak(c.Request.Context(), tenantID, userID, req.Reason); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// EndBreak ends an agent break
func (h *AgentStateHandler) EndBreak(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	if err := h.agentStateService.EndBreak(c.Request.Context(), tenantID, userID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// SetAway sets agent as away
func (h *AgentStateHandler) SetAway(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := h.agentStateService.SetAway(c.Request.Context(), tenantID, userID, req.Reason); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// SetAvailable sets agent as available
func (h *AgentStateHandler) SetAvailable(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	if err := h.agentStateService.SetAvailable(c.Request.Context(), tenantID, userID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}
