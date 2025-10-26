package service

import (
	"context"
	"time"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/core"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
	"golang.org/x/crypto/bcrypt"
)

// UserService handles user operations
type UserService interface {
	Create(ctx context.Context, tenantID string, req *dto.CreateUserRequest) (*dto.UserResponse, error)
	GetByID(ctx context.Context, id int64) (*dto.UserResponse, error)
	GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.UserResponse, int64, error)
	Update(ctx context.Context, id int64, req *dto.UpdateUserRequest) (*dto.UserResponse, error)
	Delete(ctx context.Context, id int64) error
	Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]dto.UserResponse, int64, error)
	UpdateRole(ctx context.Context, userID int64, tenantID, role string) error
	ActivateUser(ctx context.Context, id int64) error
	DeactivateUser(ctx context.Context, id int64) error
}

type userService struct {
	userRepo   repository.UserRepository
	roleRepo   repository.UserRoleRepository
	tenantRepo repository.TenantRepository
}

// NewUserService creates a new user service
func NewUserService(
	userRepo repository.UserRepository,
	roleRepo repository.UserRoleRepository,
	tenantRepo repository.TenantRepository,
) UserService {
	return &userService{
		userRepo:   userRepo,
		roleRepo:   roleRepo,
		tenantRepo: tenantRepo,
	}
}

// Create creates a new user
func (s *userService) Create(ctx context.Context, tenantID string, req *dto.CreateUserRequest) (*dto.UserResponse, error) {
	// Validate tenant exists
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil {
		return nil, errors.NewNotFound("tenant not found")
	}

	// Check resource limits (using MaxAgents as user limit)
	counts, err := s.tenantRepo.CountResourcesByTenant(ctx, tenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to check resource limits")
	}

	if counts["users"] >= tenant.MaxAgents {
		return nil, errors.NewValidation("tenant has reached maximum users limit")
	}

	// Check if user already exists
	existingUser, _ := s.userRepo.FindByEmail(ctx, req.Email)
	if existingUser != nil {
		// Check if user already has a role in this tenant
		existingRole, _ := s.roleRepo.FindByUserAndTenant(ctx, existingUser.ID, tenantID)
		if existingRole != nil {
			return nil, errors.NewValidation("user with this email already exists in this tenant")
		}
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.Wrap(err, "failed to hash password")
	}

	// Create user
	now := time.Now()
	user := &core.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FirstName:    &req.FirstName,
		LastName:     &req.LastName,
		Phone:        req.Phone,
		Status:       "active",
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, errors.Wrap(err, "failed to create user")
	}

	// Assign role (default to agent)
	userRole := &core.UserRole{
		UserID:    user.ID,
		TenantID:  tenantID,
		Role:      "agent",
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.roleRepo.Create(ctx, userRole); err != nil {
		return nil, errors.Wrap(err, "failed to assign role")
	}

	return &dto.UserResponse{
		ID:            user.ID,
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		Phone:         user.Phone,
		Status:        user.Status,
		EmailVerified: user.EmailVerified,
		Avatar:        user.Avatar,
		Timezone:      user.Timezone,
		Language:      user.Language,
		Roles:         []dto.UserRoleResponse{{TenantID: tenantID, Role: userRole.Role}},
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
	}, nil
}

// GetByID gets a user by ID
func (s *userService) GetByID(ctx context.Context, id int64) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindWithRoles(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("user not found")
	}

	// Convert UserRoles to UserRoleResponse
	roles := make([]dto.UserRoleResponse, len(user.Roles))
	for i, role := range user.Roles {
		roles[i] = dto.UserRoleResponse{
			TenantID: role.TenantID,
			Role:     role.Role,
		}
	}

	return &dto.UserResponse{
		ID:            user.ID,
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		Phone:         user.Phone,
		Status:        user.Status,
		EmailVerified: user.EmailVerified,
		Avatar:        user.Avatar,
		Timezone:      user.Timezone,
		Language:      user.Language,
		Roles:         roles,
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
	}, nil
}

// GetByTenant gets all users for a tenant with pagination
func (s *userService) GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.UserResponse, int64, error) {
	users, total, err := s.userRepo.FindByTenant(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get users")
	}

	responses := make([]dto.UserResponse, len(users))
	for i, user := range users {
		// Get roles for this user in this tenant
		userRole, _ := s.roleRepo.FindByUserAndTenant(ctx, user.ID, tenantID)

		var roles []dto.UserRoleResponse
		if userRole != nil {
			roles = []dto.UserRoleResponse{{
				TenantID: userRole.TenantID,
				Role:     userRole.Role,
			}}
		}

		responses[i] = dto.UserResponse{
			ID:            user.ID,
			Email:         user.Email,
			FirstName:     user.FirstName,
			LastName:      user.LastName,
			Phone:         user.Phone,
			Status:        user.Status,
			EmailVerified: user.EmailVerified,
			Avatar:        user.Avatar,
			Timezone:      user.Timezone,
			Language:      user.Language,
			Roles:         roles,
			CreatedAt:     user.CreatedAt,
			UpdatedAt:     user.UpdatedAt,
		}
	}

	return responses, total, nil
}

// Update updates a user
func (s *userService) Update(ctx context.Context, id int64, req *dto.UpdateUserRequest) (*dto.UserResponse, error) {
	// Get existing user
	user, err := s.userRepo.FindWithRoles(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("user not found")
	}

	// Update fields
	if req.FirstName != nil {
		user.FirstName = req.FirstName
	}
	if req.LastName != nil {
		user.LastName = req.LastName
	}
	if req.Phone != nil {
		user.Phone = req.Phone
	}
	if req.Avatar != nil {
		user.Avatar = req.Avatar
	}
	if req.Timezone != nil {
		user.Timezone = req.Timezone
	}
	if req.Language != nil {
		user.Language = req.Language
	}

	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, errors.Wrap(err, "failed to update user")
	}

	// Convert UserRoles to UserRoleResponse
	roles := make([]dto.UserRoleResponse, len(user.Roles))
	for i, role := range user.Roles {
		roles[i] = dto.UserRoleResponse{
			TenantID: role.TenantID,
			Role:     role.Role,
		}
	}

	return &dto.UserResponse{
		ID:            user.ID,
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		Phone:         user.Phone,
		Status:        user.Status,
		EmailVerified: user.EmailVerified,
		Avatar:        user.Avatar,
		Timezone:      user.Timezone,
		Language:      user.Language,
		Roles:         roles,
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
	}, nil
}

// Delete deletes a user
func (s *userService) Delete(ctx context.Context, id int64) error {
	// Check if user exists
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return errors.NewNotFound("user not found")
	}

	// Delete all user roles
	userRoles, _ := s.roleRepo.FindByUser(ctx, user.ID)
	for _, userRole := range userRoles {
		if err := s.roleRepo.Delete(ctx, userRole.ID); err != nil {
			return errors.Wrap(err, "failed to delete user role")
		}
	}

	// Delete user
	if err := s.userRepo.Delete(ctx, id); err != nil {
		return errors.Wrap(err, "failed to delete user")
	}

	return nil
}

// Search searches for users
func (s *userService) Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]dto.UserResponse, int64, error) {
	users, total, err := s.userRepo.Search(ctx, tenantID, query, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to search users")
	}

	responses := make([]dto.UserResponse, len(users))
	for i, user := range users {
		// Get roles for this user in this tenant
		userRole, _ := s.roleRepo.FindByUserAndTenant(ctx, user.ID, tenantID)

		var roles []dto.UserRoleResponse
		if userRole != nil {
			roles = []dto.UserRoleResponse{{
				TenantID: userRole.TenantID,
				Role:     userRole.Role,
			}}
		}

		responses[i] = dto.UserResponse{
			ID:            user.ID,
			Email:         user.Email,
			FirstName:     user.FirstName,
			LastName:      user.LastName,
			Phone:         user.Phone,
			Status:        user.Status,
			EmailVerified: user.EmailVerified,
			Avatar:        user.Avatar,
			Timezone:      user.Timezone,
			Language:      user.Language,
			Roles:         roles,
			CreatedAt:     user.CreatedAt,
			UpdatedAt:     user.UpdatedAt,
		}
	}

	return responses, total, nil
}

// UpdateRole updates user role
func (s *userService) UpdateRole(ctx context.Context, userID int64, tenantID, role string) error {
	// Validate role
	validRoles := map[string]bool{
		"superadmin":   true,
		"tenant_admin": true,
		"supervisor":   true,
		"agent":        true,
		"viewer":       true,
	}
	if !validRoles[role] {
		return errors.NewValidation("invalid role")
	}

	// Get existing role
	userRole, err := s.roleRepo.FindByUserAndTenant(ctx, userID, tenantID)
	if err != nil {
		return errors.Wrap(err, "failed to get user role")
	}

	// Update role
	userRole.Role = common.UserRole(role)
	userRole.UpdatedAt = time.Now()

	if err := s.roleRepo.Update(ctx, userRole); err != nil {
		return errors.Wrap(err, "failed to update role")
	}

	return nil
}

// ActivateUser activates a user
func (s *userService) ActivateUser(ctx context.Context, id int64) error {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return errors.NewNotFound("user not found")
	}

	user.Status = "active"
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		return errors.Wrap(err, "failed to activate user")
	}

	return nil
}

// DeactivateUser deactivates a user
func (s *userService) DeactivateUser(ctx context.Context, id int64) error {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return errors.NewNotFound("user not found")
	}

	user.Status = "inactive"
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		return errors.Wrap(err, "failed to deactivate user")
	}

	return nil
}
