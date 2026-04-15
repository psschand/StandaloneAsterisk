package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"gorm.io/gorm"
)

// PsEndpointRepository defines the interface for PJSIP endpoint data access
type PsEndpointRepository interface {
	Create(ctx context.Context, endpoint *asterisk.PsEndpoint) error
	FindByID(ctx context.Context, id string) (*asterisk.PsEndpoint, error)
	FindByTenant(ctx context.Context, tenantID string) ([]asterisk.PsEndpoint, error)
	Update(ctx context.Context, endpoint *asterisk.PsEndpoint) error
	Delete(ctx context.Context, id string) error
	FindWithAuthAndAor(ctx context.Context, id string) (*asterisk.PsEndpoint, error)
	FindUnassigned(ctx context.Context, tenantID string, extStart, extEnd int) ([]asterisk.PsEndpoint, error)
	FindByIDRange(ctx context.Context, extStart, extEnd int) ([]asterisk.PsEndpoint, error)
}

// psEndpointRepository implements PsEndpointRepository
type psEndpointRepository struct {
	db *gorm.DB
}

// NewPsEndpointRepository creates a new PJSIP endpoint repository
func NewPsEndpointRepository(db *gorm.DB) PsEndpointRepository {
	return &psEndpointRepository{db: db}
}

// Create creates a new PJSIP endpoint
func (r *psEndpointRepository) Create(ctx context.Context, endpoint *asterisk.PsEndpoint) error {
	return r.db.WithContext(ctx).Create(endpoint).Error
}

// FindByID finds a PJSIP endpoint by ID
func (r *psEndpointRepository) FindByID(ctx context.Context, id string) (*asterisk.PsEndpoint, error) {
	var endpoint asterisk.PsEndpoint
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&endpoint).Error
	if err != nil {
		return nil, err
	}
	return &endpoint, nil
}

// FindByTenant finds all PJSIP endpoints for a tenant
func (r *psEndpointRepository) FindByTenant(ctx context.Context, tenantID string) ([]asterisk.PsEndpoint, error) {
	var endpoints []asterisk.PsEndpoint
	// TODO: Add tenant_id column to ps_endpoints table
	// For now, return all endpoints since the table doesn't have tenant_id yet
	err := r.db.WithContext(ctx).
		Find(&endpoints).Error
	return endpoints, err
}

// Update updates a PJSIP endpoint
func (r *psEndpointRepository) Update(ctx context.Context, endpoint *asterisk.PsEndpoint) error {
	return r.db.WithContext(ctx).Save(endpoint).Error
}

// Delete deletes a PJSIP endpoint
func (r *psEndpointRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&asterisk.PsEndpoint{}).Error
}

// FindWithAuthAndAor finds an endpoint with its auth and AOR records preloaded
func (r *psEndpointRepository) FindWithAuthAndAor(ctx context.Context, id string) (*asterisk.PsEndpoint, error) {
	var endpoint asterisk.PsEndpoint
	err := r.db.WithContext(ctx).
		Preload("Auth").
		Preload("Aor").
		Where("id = ?", id).
		First(&endpoint).Error
	if err != nil {
		return nil, err
	}
	return &endpoint, nil
}

// FindByIDRange finds all PJSIP endpoints within a range of numeric IDs (for tenant extension range)
func (r *psEndpointRepository) FindByIDRange(ctx context.Context, extStart, extEnd int) ([]asterisk.PsEndpoint, error) {
	var endpoints []asterisk.PsEndpoint
	err := r.db.WithContext(ctx).
		Where("CAST(id AS SIGNED) >= ? AND CAST(id AS SIGNED) <= ?", extStart, extEnd).
		Order("CAST(id AS SIGNED) ASC").
		Find(&endpoints).Error
	return endpoints, err
}

// FindUnassigned finds all PJSIP endpoints in a tenant's range that are not assigned to any user.
// Uses a two-step query: first collect assigned extension IDs, then exclude them.
func (r *psEndpointRepository) FindUnassigned(ctx context.Context, tenantID string, extStart, extEnd int) ([]asterisk.PsEndpoint, error) {
	// Step 1: get the list of extension IDs already assigned in this tenant
	var assigned []string
	if err := r.db.WithContext(ctx).
		Table("user_roles").
		Where("tenant_id = ? AND extension IS NOT NULL", tenantID).
		Pluck("extension", &assigned).Error; err != nil {
		return nil, err
	}

	// Step 2: query endpoints in range, excluding assigned ones
	query := r.db.WithContext(ctx).
		Where("CAST(id AS SIGNED) >= ? AND CAST(id AS SIGNED) <= ?", extStart, extEnd).
		Order("CAST(id AS SIGNED) ASC")

	if len(assigned) > 0 {
		query = query.Where("id NOT IN ?", assigned)
	}

	var endpoints []asterisk.PsEndpoint
	err := query.Find(&endpoints).Error
	return endpoints, err
}
