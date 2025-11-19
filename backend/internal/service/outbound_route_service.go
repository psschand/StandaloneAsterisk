package service

import (
	"context"
	"fmt"
	"regexp"

	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/model"
	"github.com/psschand/callcenter/internal/repository"
)

type OutboundRouteService interface {
	Create(ctx context.Context, tenantID string, req *dto.CreateOutboundRouteRequest) (*dto.OutboundRouteResponse, error)
	GetByID(ctx context.Context, id int64, tenantID string) (*dto.OutboundRouteResponse, error)
	GetAll(ctx context.Context, tenantID string) ([]dto.OutboundRouteResponse, error)
	Update(ctx context.Context, id int64, tenantID string, req *dto.UpdateOutboundRouteRequest) (*dto.OutboundRouteResponse, error)
	Delete(ctx context.Context, id int64, tenantID string) error
}

type outboundRouteService struct {
	repo         repository.OutboundRouteRepository
	endpointRepo repository.PsEndpointRepository
}

func NewOutboundRouteService(repo repository.OutboundRouteRepository, endpointRepo repository.PsEndpointRepository) OutboundRouteService {
	return &outboundRouteService{
		repo:         repo,
		endpointRepo: endpointRepo,
	}
}

func (s *outboundRouteService) Create(ctx context.Context, tenantID string, req *dto.CreateOutboundRouteRequest) (*dto.OutboundRouteResponse, error) {
	// Validate regex pattern
	if _, err := regexp.Compile(req.Pattern); err != nil {
		return nil, fmt.Errorf("invalid regex pattern: %v", err)
	}

	// Verify trunk exists (check if endpoint exists with this ID)
	_, err := s.endpointRepo.FindByID(ctx, req.TrunkID)
	if err != nil {
		return nil, fmt.Errorf("trunk not found: %v", err)
	}

	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}

	priority := 100
	if req.Priority > 0 {
		priority = req.Priority
	}

	route := &model.OutboundRoute{
		TenantID:       tenantID,
		Name:           req.Name,
		Description:    req.Description,
		Pattern:        req.Pattern,
		TrunkID:        req.TrunkID,
		Priority:       priority,
		Enabled:        enabled,
		Prepend:        req.Prepend,
		Strip:          req.Strip,
		CallerIDName:   req.CallerIDName,
		CallerIDNumber: req.CallerIDNumber,
	}

	if err := s.repo.Create(ctx, route); err != nil {
		return nil, err
	}

	return s.toResponse(route, &req.TrunkID)
}

func (s *outboundRouteService) GetByID(ctx context.Context, id int64, tenantID string) (*dto.OutboundRouteResponse, error) {
	route, err := s.repo.GetByID(ctx, id, tenantID)
	if err != nil {
		return nil, err
	}

	return s.toResponse(route, &route.TrunkID)
}

func (s *outboundRouteService) GetAll(ctx context.Context, tenantID string) ([]dto.OutboundRouteResponse, error) {
	routes, err := s.repo.GetAll(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.OutboundRouteResponse, len(routes))
	for i, route := range routes {
		resp, _ := s.toResponse(&route, &route.TrunkID)
		responses[i] = *resp
	}

	return responses, nil
}

func (s *outboundRouteService) Update(ctx context.Context, id int64, tenantID string, req *dto.UpdateOutboundRouteRequest) (*dto.OutboundRouteResponse, error) {
	route, err := s.repo.GetByID(ctx, id, tenantID)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.Name != nil {
		route.Name = *req.Name
	}
	if req.Description != nil {
		route.Description = req.Description
	}
	if req.Pattern != nil {
		if _, err := regexp.Compile(*req.Pattern); err != nil {
			return nil, fmt.Errorf("invalid regex pattern: %v", err)
		}
		route.Pattern = *req.Pattern
	}
	if req.TrunkID != nil {
		// Verify trunk exists
		if _, err := s.endpointRepo.FindByID(ctx, *req.TrunkID); err != nil {
			return nil, fmt.Errorf("trunk not found: %v", err)
		}
		route.TrunkID = *req.TrunkID
	}
	if req.Priority != nil {
		route.Priority = *req.Priority
	}
	if req.Enabled != nil {
		route.Enabled = *req.Enabled
	}
	if req.Prepend != nil {
		route.Prepend = req.Prepend
	}
	if req.Strip != nil {
		route.Strip = *req.Strip
	}
	if req.CallerIDName != nil {
		route.CallerIDName = req.CallerIDName
	}
	if req.CallerIDNumber != nil {
		route.CallerIDNumber = req.CallerIDNumber
	}

	if err := s.repo.Update(ctx, route); err != nil {
		return nil, err
	}

	return s.toResponse(route, &route.TrunkID)
}

func (s *outboundRouteService) Delete(ctx context.Context, id int64, tenantID string) error {
	return s.repo.Delete(ctx, id, tenantID)
}

func (s *outboundRouteService) toResponse(route *model.OutboundRoute, trunkName *string) (*dto.OutboundRouteResponse, error) {
	return &dto.OutboundRouteResponse{
		ID:             route.ID,
		TenantID:       route.TenantID,
		Name:           route.Name,
		Description:    route.Description,
		Pattern:        route.Pattern,
		TrunkID:        route.TrunkID,
		TrunkName:      trunkName,
		Priority:       route.Priority,
		Enabled:        route.Enabled,
		Prepend:        route.Prepend,
		Strip:          route.Strip,
		CallerIDName:   route.CallerIDName,
		CallerIDNumber: route.CallerIDNumber,
		CreatedAt:      route.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:      route.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}
