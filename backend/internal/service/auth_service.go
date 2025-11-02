package service

import (
	"context"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/core"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
	"github.com/psschand/callcenter/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication operations
type AuthService interface {
	Register(ctx context.Context, req *dto.RegisterRequest) (*dto.AuthResponse, error)
	Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*dto.AuthResponse, error)
	ChangePassword(ctx context.Context, userID int64, req *dto.ChangePasswordRequest) error
	ResetPasswordRequest(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, token string, newPassword string) error
	ValidateToken(ctx context.Context, token string) (*jwt.Claims, error)
}

type authService struct {
	userRepo   repository.UserRepository
	tenantRepo repository.TenantRepository
	roleRepo   repository.UserRoleRepository
	jwtService jwt.JWTService
}

// NewAuthService creates a new authentication service
func NewAuthService(
	userRepo repository.UserRepository,
	tenantRepo repository.TenantRepository,
	roleRepo repository.UserRoleRepository,
	jwtService jwt.JWTService,
) AuthService {
	return &authService{
		userRepo:   userRepo,
		tenantRepo: tenantRepo,
		roleRepo:   roleRepo,
		jwtService: jwtService,
	}
}

// Register registers a new user
func (s *authService) Register(ctx context.Context, req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	// Validate tenant exists
	tenant, err := s.tenantRepo.FindByID(ctx, req.TenantID)
	if err != nil {
		return nil, errors.NewNotFound("tenant not found")
	}

	// Check if tenant is active
	if tenant.Status != "active" {
		return nil, errors.NewValidation("tenant is not active")
	}

	// Check if user already exists
	existingUser, _ := s.userRepo.FindByEmail(ctx, req.Email)
	if existingUser != nil {
		return nil, errors.NewValidation("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.Wrap(err, "failed to hash password")
	}

	// Create user
	firstName := req.FirstName
	lastName := req.LastName
	user := &core.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FirstName:    &firstName,
		LastName:     &lastName,
	}
	if req.Phone != "" {
		user.Phone = &req.Phone
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, errors.Wrap(err, "failed to create user")
	}

	// Assign default role (agent)
	role := common.RoleAgent

	userRole := &core.UserRole{
		UserID:   user.ID,
		TenantID: req.TenantID,
		Role:     role,
	}

	if err := s.roleRepo.Create(ctx, userRole); err != nil {
		return nil, errors.Wrap(err, "failed to assign role")
	}

	// Generate tokens
	accessToken, err := s.jwtService.GenerateAccessToken(user.ID, req.TenantID, user.Email, role)
	if err != nil {
		return nil, errors.Wrap(err, "failed to generate access token")
	}

	refreshToken, err := s.jwtService.GenerateRefreshToken(user.ID, req.TenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to generate refresh token")
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Phone:     user.Phone,
		},
		ExpiresIn: 3600,
	}, nil
}

// Login authenticates a user
func (s *authService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.NewUnauthorized("invalid credentials")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.NewUnauthorized("invalid credentials")
	}

	// Check if user has access to this tenant
	userRole, err := s.roleRepo.FindByUserAndTenant(ctx, user.ID, req.TenantID)
	if err != nil {
		return nil, errors.NewUnauthorized("invalid credentials")
	}

	// Check if user status is active
	if user.Status != common.UserStatusActive {
		return nil, errors.NewUnauthorized("user account is inactive")
	}

	// Update last login - commented out due to schema mismatch
	// now := time.Now()
	// user.LastLoginAt = &now
	// if err := s.userRepo.Update(ctx, user); err != nil {
	// 	// Log error but don't fail login
	// }

	// Generate tokens
	accessToken, err := s.jwtService.GenerateAccessToken(user.ID, req.TenantID, user.Email, userRole.Role)
	if err != nil {
		return nil, errors.Wrap(err, "failed to generate access token")
	}

	refreshToken, err := s.jwtService.GenerateRefreshToken(user.ID, req.TenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to generate refresh token")
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Phone:     user.Phone,
			Status:    user.Status,
			Roles: []dto.UserRoleResponse{
				{
					ID:       userRole.ID,
					TenantID: userRole.TenantID,
					Role:     userRole.Role,
				},
			},
		},
		ExpiresIn: 3600,
	}, nil
}

// RefreshToken generates new access token using refresh token
func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*dto.AuthResponse, error) {
	// Validate refresh token
	claims, err := s.jwtService.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, errors.NewUnauthorized("invalid refresh token")
	}

	// Get user
	user, err := s.userRepo.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, errors.NewUnauthorized("user not found")
	}

	// Check if user status is active
	if user.Status != common.UserStatusActive {
		return nil, errors.NewUnauthorized("user account is inactive")
	}

	// Get user role for tenant from claims
	userRole, err := s.roleRepo.FindByUserAndTenant(ctx, user.ID, claims.TenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get user role")
	}

	// Generate new access token
	accessToken, err := s.jwtService.GenerateAccessToken(user.ID, claims.TenantID, user.Email, userRole.Role)
	if err != nil {
		return nil, errors.Wrap(err, "failed to generate access token")
	}

	// Generate new refresh token
	newRefreshToken, err := s.jwtService.GenerateRefreshToken(user.ID, claims.TenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to generate refresh token")
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		User: dto.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Phone:     user.Phone,
		},
		ExpiresIn: 3600,
	}, nil
}

// ChangePassword changes user password
func (s *authService) ChangePassword(ctx context.Context, userID int64, req *dto.ChangePasswordRequest) error {
	// Get user
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return errors.NewNotFound("user not found")
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		return errors.NewUnauthorized("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.Wrap(err, "failed to hash password")
	}

	// Update password
	if err := s.userRepo.UpdatePassword(ctx, userID, string(hashedPassword)); err != nil {
		return errors.Wrap(err, "failed to update password")
	}

	return nil
}

// ResetPasswordRequest initiates password reset process
func (s *authService) ResetPasswordRequest(ctx context.Context, email string) error {
	// Find user by email
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		// Don't reveal if user exists
		return nil
	}

	// TODO: Generate reset token and send email
	// For now, just log that reset was requested
	_ = user

	return nil
}

// ResetPassword resets password using reset token
func (s *authService) ResetPassword(ctx context.Context, token string, newPassword string) error {
	// TODO: Validate reset token and get user ID
	// For now, return not implemented
	return errors.New("not implemented", "password reset not implemented")
}

// ValidateToken validates an access token
func (s *authService) ValidateToken(ctx context.Context, token string) (*jwt.Claims, error) {
	claims, err := s.jwtService.ValidateAccessToken(token)
	if err != nil {
		return nil, errors.NewUnauthorized("invalid token")
	}

	// Verify user still exists and is active
	user, err := s.userRepo.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, errors.NewUnauthorized("user not found")
	}

	if user.Status != common.UserStatusActive {
		return nil, errors.NewUnauthorized("user account is inactive")
	}

	return claims, nil
}
