package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/core"
	"gorm.io/gorm"
)

// UserRoleRepository defines the interface for user role data access
type UserRoleRepository interface {
	Create(ctx context.Context, role *core.UserRole) error
	FindByID(ctx context.Context, id int64) (*core.UserRole, error)
	FindByUserAndTenant(ctx context.Context, userID int64, tenantID string) (*core.UserRole, error)
	FindByUser(ctx context.Context, userID int64) ([]core.UserRole, error)
	Update(ctx context.Context, role *core.UserRole) error
	Delete(ctx context.Context, id int64) error
	HasRole(ctx context.Context, userID int64, tenantID string, role common.UserRole) (bool, error)
	FindByTenantAndRole(ctx context.Context, tenantID string, role common.UserRole) ([]core.UserRole, error)
}

// userRoleRepository implements UserRoleRepository
type userRoleRepository struct {
	db *gorm.DB
}

// NewUserRoleRepository creates a new user role repository
func NewUserRoleRepository(db *gorm.DB) UserRoleRepository {
	return &userRoleRepository{db: db}
}

// Create creates a new user role
func (r *userRoleRepository) Create(ctx context.Context, role *core.UserRole) error {
	return r.db.WithContext(ctx).Create(role).Error
}

// FindByID finds a user role by ID
func (r *userRoleRepository) FindByID(ctx context.Context, id int64) (*core.UserRole, error) {
	var role core.UserRole
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// FindByUserAndTenant finds a user's role in a specific tenant
func (r *userRoleRepository) FindByUserAndTenant(ctx context.Context, userID int64, tenantID string) (*core.UserRole, error) {
	var role core.UserRole
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND tenant_id = ?", userID, tenantID).
		First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// FindByUser finds all roles for a user across all tenants
func (r *userRoleRepository) FindByUser(ctx context.Context, userID int64) ([]core.UserRole, error) {
	var roles []core.UserRole
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Find(&roles).Error
	return roles, err
}

// Update updates a user role
func (r *userRoleRepository) Update(ctx context.Context, role *core.UserRole) error {
	return r.db.WithContext(ctx).Save(role).Error
}

// Delete deletes a user role
func (r *userRoleRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&core.UserRole{}).Error
}

// HasRole checks if a user has a specific role in a tenant
func (r *userRoleRepository) HasRole(ctx context.Context, userID int64, tenantID string, role common.UserRole) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&core.UserRole{}).
		Where("user_id = ? AND tenant_id = ? AND role = ?", userID, tenantID, role).
		Count(&count).Error
	return count > 0, err
}

// FindByTenantAndRole finds all users with a specific role in a tenant
func (r *userRoleRepository) FindByTenantAndRole(ctx context.Context, tenantID string, role common.UserRole) ([]core.UserRole, error) {
	var roles []core.UserRole
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("tenant_id = ? AND role = ?", tenantID, role).
		Find(&roles).Error
	return roles, err
}
