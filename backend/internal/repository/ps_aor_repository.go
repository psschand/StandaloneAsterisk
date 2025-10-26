package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"gorm.io/gorm"
)

// PsAorRepository defines the interface for PJSIP AOR data access
type PsAorRepository interface {
	Create(ctx context.Context, aor *asterisk.PsAor) error
	FindByID(ctx context.Context, id string) (*asterisk.PsAor, error)
	FindByEndpoint(ctx context.Context, endpointID string) (*asterisk.PsAor, error)
	Update(ctx context.Context, aor *asterisk.PsAor) error
	Delete(ctx context.Context, id string) error
}

// psAorRepository implements PsAorRepository
type psAorRepository struct {
	db *gorm.DB
}

// NewPsAorRepository creates a new PJSIP AOR repository
func NewPsAorRepository(db *gorm.DB) PsAorRepository {
	return &psAorRepository{db: db}
}

// Create creates a new PJSIP AOR
func (r *psAorRepository) Create(ctx context.Context, aor *asterisk.PsAor) error {
	return r.db.WithContext(ctx).Create(aor).Error
}

// FindByID finds a PJSIP AOR by ID
func (r *psAorRepository) FindByID(ctx context.Context, id string) (*asterisk.PsAor, error) {
	var aor asterisk.PsAor
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&aor).Error
	if err != nil {
		return nil, err
	}
	return &aor, nil
}

// FindByEndpoint finds the AOR for an endpoint
func (r *psAorRepository) FindByEndpoint(ctx context.Context, endpointID string) (*asterisk.PsAor, error) {
	var aor asterisk.PsAor
	err := r.db.WithContext(ctx).Where("id = ?", endpointID).First(&aor).Error
	if err != nil {
		return nil, err
	}
	return &aor, nil
}

// Update updates a PJSIP AOR
func (r *psAorRepository) Update(ctx context.Context, aor *asterisk.PsAor) error {
	return r.db.WithContext(ctx).Save(aor).Error
}

// Delete deletes a PJSIP AOR
func (r *psAorRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&asterisk.PsAor{}).Error
}
