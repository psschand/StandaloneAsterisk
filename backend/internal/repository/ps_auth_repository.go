package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"gorm.io/gorm"
)

// PsAuthRepository defines the interface for PJSIP auth data access
type PsAuthRepository interface {
	Create(ctx context.Context, auth *asterisk.PsAuth) error
	FindByID(ctx context.Context, id string) (*asterisk.PsAuth, error)
	FindByEndpoint(ctx context.Context, endpointID string) (*asterisk.PsAuth, error)
	Update(ctx context.Context, auth *asterisk.PsAuth) error
	Delete(ctx context.Context, id string) error
}

// psAuthRepository implements PsAuthRepository
type psAuthRepository struct {
	db *gorm.DB
}

// NewPsAuthRepository creates a new PJSIP auth repository
func NewPsAuthRepository(db *gorm.DB) PsAuthRepository {
	return &psAuthRepository{db: db}
}

// Create creates a new PJSIP auth
func (r *psAuthRepository) Create(ctx context.Context, auth *asterisk.PsAuth) error {
	return r.db.WithContext(ctx).Create(auth).Error
}

// FindByID finds a PJSIP auth by ID
func (r *psAuthRepository) FindByID(ctx context.Context, id string) (*asterisk.PsAuth, error) {
	var auth asterisk.PsAuth
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&auth).Error
	if err != nil {
		return nil, err
	}
	return &auth, nil
}

// FindByEndpoint finds the auth for an endpoint
func (r *psAuthRepository) FindByEndpoint(ctx context.Context, endpointID string) (*asterisk.PsAuth, error) {
	var auth asterisk.PsAuth
	err := r.db.WithContext(ctx).Where("id = ?", endpointID).First(&auth).Error
	if err != nil {
		return nil, err
	}
	return &auth, nil
}

// Update updates a PJSIP auth
func (r *psAuthRepository) Update(ctx context.Context, auth *asterisk.PsAuth) error {
	return r.db.WithContext(ctx).Save(auth).Error
}

// Delete deletes a PJSIP auth
func (r *psAuthRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&asterisk.PsAuth{}).Error
}
