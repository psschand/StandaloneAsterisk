package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/core"
	"gorm.io/gorm"
)

// TenantRepository defines the interface for tenant data access
type TenantRepository interface {
	Create(ctx context.Context, tenant *core.Tenant) error
	FindByID(ctx context.Context, id string) (*core.Tenant, error)
	FindAll(ctx context.Context, page, pageSize int) ([]core.Tenant, int64, error)
	Update(ctx context.Context, tenant *core.Tenant) error
	Delete(ctx context.Context, id string) error
	FindByDomain(ctx context.Context, domain string) (*core.Tenant, error)
	FindActiveTrials(ctx context.Context) ([]core.Tenant, error)
	CountResourcesByTenant(ctx context.Context, tenantID string) (map[string]int, error)
}

// tenantRepository implements TenantRepository
type tenantRepository struct {
	db *gorm.DB
}

// NewTenantRepository creates a new tenant repository
func NewTenantRepository(db *gorm.DB) TenantRepository {
	return &tenantRepository{db: db}
}

// Create creates a new tenant
func (r *tenantRepository) Create(ctx context.Context, tenant *core.Tenant) error {
	return r.db.WithContext(ctx).Create(tenant).Error
}

// FindByID finds a tenant by ID
func (r *tenantRepository) FindByID(ctx context.Context, id string) (*core.Tenant, error) {
	var tenant core.Tenant
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&tenant).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

// FindAll finds all tenants with pagination
func (r *tenantRepository) FindAll(ctx context.Context, page, pageSize int) ([]core.Tenant, int64, error) {
	var tenants []core.Tenant
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&core.Tenant{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&tenants).Error

	return tenants, total, err
}

// Update updates a tenant
func (r *tenantRepository) Update(ctx context.Context, tenant *core.Tenant) error {
	return r.db.WithContext(ctx).Save(tenant).Error
}

// Delete soft deletes a tenant
func (r *tenantRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&core.Tenant{}).Error
}

// FindByDomain finds a tenant by domain
func (r *tenantRepository) FindByDomain(ctx context.Context, domain string) (*core.Tenant, error) {
	var tenant core.Tenant
	err := r.db.WithContext(ctx).Where("domain = ?", domain).First(&tenant).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

// FindActiveTrials finds all tenants with active trials
func (r *tenantRepository) FindActiveTrials(ctx context.Context) ([]core.Tenant, error) {
	var tenants []core.Tenant
	err := r.db.WithContext(ctx).
		Where("status = ? AND trial_expires_at > NOW()", "trial").
		Find(&tenants).Error
	return tenants, err
}

// CountResourcesByTenant counts various resources for a tenant
func (r *tenantRepository) CountResourcesByTenant(ctx context.Context, tenantID string) (map[string]int, error) {
	counts := make(map[string]int)

	// Count users
	var userCount int64
	if err := r.db.WithContext(ctx).Model(&core.User{}).Where("tenant_id = ?", tenantID).Count(&userCount).Error; err != nil {
		return nil, err
	}
	counts["users"] = int(userCount)

	// Count DIDs (assuming DID model exists)
	var didCount int64
	if err := r.db.WithContext(ctx).Table("dids").Where("tenant_id = ?", tenantID).Count(&didCount).Error; err != nil {
		return nil, err
	}
	counts["dids"] = int(didCount)

	// Count queues
	var queueCount int64
	if err := r.db.WithContext(ctx).Table("queues").Where("tenant_id = ?", tenantID).Count(&queueCount).Error; err != nil {
		return nil, err
	}
	counts["queues"] = int(queueCount)

	return counts, nil
}
