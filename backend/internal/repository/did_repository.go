package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/common"
	"gorm.io/gorm"
)

// DIDRepository defines the interface for DID data access
type DIDRepository interface {
	Create(ctx context.Context, did *asterisk.DID) error
	FindByID(ctx context.Context, id int64) (*asterisk.DID, error)
	FindByNumber(ctx context.Context, number string) (*asterisk.DID, error)
	FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]asterisk.DID, int64, error)
	Update(ctx context.Context, did *asterisk.DID) error
	Delete(ctx context.Context, id int64) error
	FindByStatus(ctx context.Context, tenantID string, status common.DIDStatus) ([]asterisk.DID, error)
	FindAvailable(ctx context.Context) ([]asterisk.DID, error)
}

// didRepository implements DIDRepository
type didRepository struct {
	db *gorm.DB
}

// NewDIDRepository creates a new DID repository
func NewDIDRepository(db *gorm.DB) DIDRepository {
	return &didRepository{db: db}
}

// Create creates a new DID
func (r *didRepository) Create(ctx context.Context, did *asterisk.DID) error {
	return r.db.WithContext(ctx).Create(did).Error
}

// FindByID finds a DID by ID
func (r *didRepository) FindByID(ctx context.Context, id int64) (*asterisk.DID, error) {
	var did asterisk.DID
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&did).Error
	if err != nil {
		return nil, err
	}
	return &did, nil
}

// FindByNumber finds a DID by phone number
func (r *didRepository) FindByNumber(ctx context.Context, number string) (*asterisk.DID, error) {
	var did asterisk.DID
	err := r.db.WithContext(ctx).Where("number = ?", number).First(&did).Error
	if err != nil {
		return nil, err
	}
	return &did, nil
}

// FindByTenant finds all DIDs for a tenant with pagination
func (r *didRepository) FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]asterisk.DID, int64, error) {
	var dids []asterisk.DID
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&asterisk.DID{}).Where("tenant_id = ?", tenantID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&dids).Error

	return dids, total, err
}

// Update updates a DID
func (r *didRepository) Update(ctx context.Context, did *asterisk.DID) error {
	return r.db.WithContext(ctx).Save(did).Error
}

// Delete deletes a DID
func (r *didRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&asterisk.DID{}).Error
}

// FindByStatus finds DIDs by status
func (r *didRepository) FindByStatus(ctx context.Context, tenantID string, status common.DIDStatus) ([]asterisk.DID, error) {
	var dids []asterisk.DID
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND status = ?", tenantID, status).
		Find(&dids).Error
	return dids, err
}

// FindAvailable finds all available DIDs across all tenants (for superadmin)
func (r *didRepository) FindAvailable(ctx context.Context) ([]asterisk.DID, error) {
	var dids []asterisk.DID
	err := r.db.WithContext(ctx).
		Where("status = ?", common.DIDStatusActive).
		Find(&dids).Error
	return dids, err
}
