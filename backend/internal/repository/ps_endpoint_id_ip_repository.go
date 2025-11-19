package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"gorm.io/gorm"
)

// PsEndpointIdIpRepository defines the interface for PJSIP endpoint ID IP data access
type PsEndpointIdIpRepository interface {
	Create(ctx context.Context, idIp *asterisk.PsEndpointIdIp) error
	FindByEndpoint(ctx context.Context, endpoint string) (*asterisk.PsEndpointIdIp, error)
	Delete(ctx context.Context, id string) error
}

// psEndpointIdIpRepository implements PsEndpointIdIpRepository
type psEndpointIdIpRepository struct {
	db *gorm.DB
}

// NewPsEndpointIdIpRepository creates a new PJSIP endpoint ID IP repository
func NewPsEndpointIdIpRepository(db *gorm.DB) PsEndpointIdIpRepository {
	return &psEndpointIdIpRepository{db: db}
}

// Create creates a new PJSIP endpoint ID IP entry
func (r *psEndpointIdIpRepository) Create(ctx context.Context, idIp *asterisk.PsEndpointIdIp) error {
	return r.db.WithContext(ctx).Create(idIp).Error
}

// FindByEndpoint finds a PJSIP endpoint ID IP entry by endpoint
func (r *psEndpointIdIpRepository) FindByEndpoint(ctx context.Context, endpoint string) (*asterisk.PsEndpointIdIp, error) {
	var idIp asterisk.PsEndpointIdIp
	err := r.db.WithContext(ctx).Where("endpoint = ?", endpoint).First(&idIp).Error
	if err != nil {
		return nil, err
	}
	return &idIp, nil
}

// Delete deletes a PJSIP endpoint ID IP entry
func (r *psEndpointIdIpRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&asterisk.PsEndpointIdIp{}).Error
}
