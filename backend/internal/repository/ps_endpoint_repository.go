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
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
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
