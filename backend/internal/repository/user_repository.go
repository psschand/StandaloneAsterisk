package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/core"
	"gorm.io/gorm"
)

// UserRepository defines the interface for user data access
type UserRepository interface {
	Create(ctx context.Context, user *core.User) error
	FindByID(ctx context.Context, id int64) (*core.User, error)
	FindByEmail(ctx context.Context, email string) (*core.User, error)
	FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]core.User, int64, error)
	Update(ctx context.Context, user *core.User) error
	Delete(ctx context.Context, id int64) error
	UpdatePassword(ctx context.Context, id int64, passwordHash string) error
	FindWithRoles(ctx context.Context, id int64) (*core.User, error)
	Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]core.User, int64, error)
}

// userRepository implements UserRepository
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// Create creates a new user
func (r *userRepository) Create(ctx context.Context, user *core.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

// FindByID finds a user by ID
func (r *userRepository) FindByID(ctx context.Context, id int64) (*core.User, error) {
	var user core.User
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByEmail finds a user by email
func (r *userRepository) FindByEmail(ctx context.Context, email string) (*core.User, error) {
	var user core.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByTenant finds all users in a tenant with pagination
func (r *userRepository) FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]core.User, int64, error) {
	var users []core.User
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&core.User{}).Where("tenant_id = ?", tenantID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&users).Error

	return users, total, err
}

// Update updates a user
func (r *userRepository) Update(ctx context.Context, user *core.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

// Delete soft deletes a user
func (r *userRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&core.User{}).Error
}

// UpdatePassword updates a user's password
func (r *userRepository) UpdatePassword(ctx context.Context, id int64, passwordHash string) error {
	return r.db.WithContext(ctx).
		Model(&core.User{}).
		Where("id = ?", id).
		Update("password_hash", passwordHash).Error
}

// FindWithRoles finds a user with their roles preloaded
func (r *userRepository) FindWithRoles(ctx context.Context, id int64) (*core.User, error) {
	var user core.User
	err := r.db.WithContext(ctx).
		Preload("Roles").
		Where("id = ?", id).
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Search searches users by name or email
func (r *userRepository) Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]core.User, int64, error) {
	var users []core.User
	var total int64

	searchQuery := "%" + query + "%"
	baseQuery := r.db.WithContext(ctx).
		Model(&core.User{}).
		Where("tenant_id = ?", tenantID).
		Where("first_name LIKE ? OR last_name LIKE ? OR email LIKE ?", searchQuery, searchQuery, searchQuery)

	// Count total
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := baseQuery.
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&users).Error

	return users, total, err
}
