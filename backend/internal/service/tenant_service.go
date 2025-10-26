package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/core"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
)

// TenantService handles tenant operations
type TenantService interface {
	Create(ctx context.Context, req *dto.CreateTenantRequest) (*dto.TenantResponse, error)
	GetByID(ctx context.Context, id string) (*dto.TenantResponse, error)
	GetAll(ctx context.Context, page, pageSize int) ([]dto.TenantResponse, int64, error)
	Update(ctx context.Context, id string, req *dto.UpdateTenantRequest) (*dto.TenantResponse, error)
	Delete(ctx context.Context, id string) error
	GetByDomain(ctx context.Context, domain string) (*dto.TenantResponse, error)
	GetResourceUsage(ctx context.Context, id string) (*dto.TenantResourceUsage, error)
	UpdateStatus(ctx context.Context, id string, status string) error
}

type tenantService struct {
	tenantRepo repository.TenantRepository
}

// NewTenantService creates a new tenant service
func NewTenantService(tenantRepo repository.TenantRepository) TenantService {
	return &tenantService{
		tenantRepo: tenantRepo,
	}
}

// Create creates a new tenant
func (s *tenantService) Create(ctx context.Context, req *dto.CreateTenantRequest) (*dto.TenantResponse, error) {
	// Validate domain is unique if provided
	if req.Domain != nil && *req.Domain != "" {
		existingTenant, _ := s.tenantRepo.FindByDomain(ctx, *req.Domain)
		if existingTenant != nil {
			return nil, errors.NewValidation("tenant with this domain already exists")
		}
	}

	// Generate tenant ID from name
	tenantID := generateTenantID(req.Name)

	// Create tenant
	now := time.Now()
	tenant := &core.Tenant{
		ID:                 tenantID,
		Name:               req.Name,
		Domain:             req.Domain,
		Status:             "active",
		MaxAgents:          req.MaxAgents,
		MaxDIDs:            req.MaxDIDs,
		MaxConcurrentCalls: req.MaxConcurrentCalls,
		Features:           req.Features,
		Settings:           req.Settings,
		BillingEmail:       req.BillingEmail,
		ContactName:        req.ContactName,
		ContactPhone:       req.ContactPhone,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	if err := s.tenantRepo.Create(ctx, tenant); err != nil {
		return nil, errors.Wrap(err, "failed to create tenant")
	}

	return &dto.TenantResponse{
		ID:                 tenant.ID,
		Name:               tenant.Name,
		Domain:             tenant.Domain,
		Status:             tenant.Status,
		MaxAgents:          tenant.MaxAgents,
		MaxDIDs:            tenant.MaxDIDs,
		MaxConcurrentCalls: tenant.MaxConcurrentCalls,
		Features:           tenant.Features,
		Settings:           tenant.Settings,
		CreatedAt:          tenant.CreatedAt,
		UpdatedAt:          tenant.UpdatedAt,
	}, nil
}

// GetByID gets a tenant by ID
func (s *tenantService) GetByID(ctx context.Context, id string) (*dto.TenantResponse, error) {
	tenant, err := s.tenantRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("tenant not found")
	}

	return &dto.TenantResponse{
		ID:                 tenant.ID,
		Name:               tenant.Name,
		Domain:             tenant.Domain,
		Status:             tenant.Status,
		MaxAgents:          tenant.MaxAgents,
		MaxDIDs:            tenant.MaxDIDs,
		MaxConcurrentCalls: tenant.MaxConcurrentCalls,
		Features:           tenant.Features,
		Settings:           tenant.Settings,
		CreatedAt:          tenant.CreatedAt,
		UpdatedAt:          tenant.UpdatedAt,
	}, nil
}

// GetAll gets all tenants with pagination
func (s *tenantService) GetAll(ctx context.Context, page, pageSize int) ([]dto.TenantResponse, int64, error) {
	tenants, total, err := s.tenantRepo.FindAll(ctx, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get tenants")
	}

	responses := make([]dto.TenantResponse, len(tenants))
	for i, tenant := range tenants {
		responses[i] = dto.TenantResponse{
			ID:                 tenant.ID,
			Name:               tenant.Name,
			Domain:             tenant.Domain,
			Status:             tenant.Status,
			MaxAgents:          tenant.MaxAgents,
			MaxDIDs:            tenant.MaxDIDs,
			MaxConcurrentCalls: tenant.MaxConcurrentCalls,
			Features:           tenant.Features,
			Settings:           tenant.Settings,
			CreatedAt:          tenant.CreatedAt,
			UpdatedAt:          tenant.UpdatedAt,
		}
	}

	return responses, total, nil
}

// Update updates a tenant
func (s *tenantService) Update(ctx context.Context, id string, req *dto.UpdateTenantRequest) (*dto.TenantResponse, error) {
	// Get existing tenant
	tenant, err := s.tenantRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("tenant not found")
	}

	// Update fields
	if req.Name != nil {
		tenant.Name = *req.Name
	}
	if req.Domain != nil && *req.Domain != "" {
		// Check if domain is unique
		existingTenant, _ := s.tenantRepo.FindByDomain(ctx, *req.Domain)
		if existingTenant != nil && existingTenant.ID != id {
			return nil, errors.NewValidation("tenant with this domain already exists")
		}
		tenant.Domain = req.Domain
	}
	if req.Status != nil {
		tenant.Status = *req.Status
	}
	if req.MaxAgents != nil {
		tenant.MaxAgents = *req.MaxAgents
	}
	if req.MaxDIDs != nil {
		tenant.MaxDIDs = *req.MaxDIDs
	}
	if req.MaxConcurrentCalls != nil {
		tenant.MaxConcurrentCalls = *req.MaxConcurrentCalls
	}
	if req.Features != nil {
		tenant.Features = *req.Features
	}
	if req.Settings != nil {
		tenant.Settings = *req.Settings
	}
	if req.BillingEmail != nil {
		tenant.BillingEmail = req.BillingEmail
	}
	if req.ContactName != nil {
		tenant.ContactName = req.ContactName
	}
	if req.ContactPhone != nil {
		tenant.ContactPhone = req.ContactPhone
	}

	tenant.UpdatedAt = time.Now()

	if err := s.tenantRepo.Update(ctx, tenant); err != nil {
		return nil, errors.Wrap(err, "failed to update tenant")
	}

	return &dto.TenantResponse{
		ID:                 tenant.ID,
		Name:               tenant.Name,
		Domain:             tenant.Domain,
		Status:             tenant.Status,
		MaxAgents:          tenant.MaxAgents,
		MaxDIDs:            tenant.MaxDIDs,
		MaxConcurrentCalls: tenant.MaxConcurrentCalls,
		Features:           tenant.Features,
		Settings:           tenant.Settings,
		CreatedAt:          tenant.CreatedAt,
		UpdatedAt:          tenant.UpdatedAt,
	}, nil
}

// Delete deletes a tenant
func (s *tenantService) Delete(ctx context.Context, id string) error {
	// Check if tenant exists
	_, err := s.tenantRepo.FindByID(ctx, id)
	if err != nil {
		return errors.NewNotFound("tenant not found")
	}

	if err := s.tenantRepo.Delete(ctx, id); err != nil {
		return errors.Wrap(err, "failed to delete tenant")
	}

	return nil
}

// GetByDomain gets a tenant by domain
func (s *tenantService) GetByDomain(ctx context.Context, domain string) (*dto.TenantResponse, error) {
	tenant, err := s.tenantRepo.FindByDomain(ctx, domain)
	if err != nil {
		return nil, errors.NewNotFound("tenant not found")
	}

	return &dto.TenantResponse{
		ID:                 tenant.ID,
		Name:               tenant.Name,
		Domain:             tenant.Domain,
		Status:             tenant.Status,
		MaxAgents:          tenant.MaxAgents,
		MaxDIDs:            tenant.MaxDIDs,
		MaxConcurrentCalls: tenant.MaxConcurrentCalls,
		Features:           tenant.Features,
		Settings:           tenant.Settings,
		CreatedAt:          tenant.CreatedAt,
		UpdatedAt:          tenant.UpdatedAt,
	}, nil
}

// GetResourceUsage gets resource usage for a tenant
func (s *tenantService) GetResourceUsage(ctx context.Context, id string) (*dto.TenantResourceUsage, error) {
	// Check if tenant exists
	tenant, err := s.tenantRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("tenant not found")
	}

	// Get resource counts
	counts, err := s.tenantRepo.CountResourcesByTenant(ctx, id)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get resource counts")
	}

	return &dto.TenantResourceUsage{
		TenantID:           id,
		UsersCount:         counts["users"],
		MaxAgents:          tenant.MaxAgents,
		DIDsCount:          counts["dids"],
		MaxDIDs:            tenant.MaxDIDs,
		QueuesCount:        counts["queues"],
		ActiveCallsCount:   counts["active_calls"],
		MaxConcurrentCalls: tenant.MaxConcurrentCalls,
	}, nil
} // UpdateStatus updates tenant status
func (s *tenantService) UpdateStatus(ctx context.Context, id string, status string) error {
	// Validate status
	validStatuses := map[string]bool{
		"active":    true,
		"suspended": true,
		"cancelled": true,
	}
	if !validStatuses[status] {
		return errors.NewValidation("invalid status")
	}

	// Get tenant
	tenant, err := s.tenantRepo.FindByID(ctx, id)
	if err != nil {
		return errors.NewNotFound("tenant not found")
	}

	// Update status
	tenant.Status = common.TenantStatus(status)
	tenant.UpdatedAt = time.Now()

	if err := s.tenantRepo.Update(ctx, tenant); err != nil {
		return errors.Wrap(err, "failed to update tenant status")
	}

	return nil
}

// generateTenantID generates a tenant ID from name
func generateTenantID(name string) string {
	// Convert to lowercase and replace spaces with hyphens
	id := strings.ToLower(name)
	id = strings.ReplaceAll(id, " ", "-")

	// Remove special characters
	var result strings.Builder
	for _, r := range id {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}

	// Add timestamp suffix to ensure uniqueness
	return fmt.Sprintf("%s-%d", result.String(), time.Now().Unix())
}
