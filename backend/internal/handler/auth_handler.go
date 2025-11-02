package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	authService service.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Register handles user registration
// @Summary Register a new user
// @Tags auth
// @Accept json
// @Produce json
// @Param request body dto.RegisterRequest true "Registration request"
// @Success 201 {object} response.Response
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	c.JSON(201, gin.H{
		"success": true,
		"data":    result,
		"message": "User registered successfully",
	})
}

// Login handles user login
// @Summary Login
// @Tags auth
// @Accept json
// @Produce json
// @Param request body dto.LoginRequest true "Login request"
// @Success 200 {object} response.Response
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    result,
		"message": "Login successful",
	})
}

// RefreshToken handles token refresh
// @Summary Refresh access token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body map[string]string true "Refresh token request"
// @Success 200 {object} response.Response
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		response.Error(c, err)
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    result,
		"message": "Token refreshed successfully",
	})
}

// ChangePassword handles password change
// @Summary Change password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body dto.ChangePasswordRequest true "Change password request"
// @Success 200 {object} response.Response
// @Security Bearer
// @Router /auth/change-password [post]
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.authService.ChangePassword(c.Request.Context(), userID, &req); err != nil {
		response.Error(c, err)
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Password changed successfully",
	})
}

// ResetPasswordRequest handles password reset request
// @Summary Request password reset
// @Tags auth
// @Accept json
// @Produce json
// @Param request body map[string]string true "Reset password request"
// @Success 200 {object} response.Response
// @Router /auth/reset-password-request [post]
func (h *AuthHandler) ResetPasswordRequest(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.authService.ResetPasswordRequest(c.Request.Context(), req.Email); err != nil {
		response.Error(c, err)
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Password reset email sent",
	})
}

// Me returns current user info
// @Summary Get current user
// @Tags auth
// @Produce json
// @Success 200 {object} response.Response
// @Security Bearer
// @Router /auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.GetInt64("user_id")
	tenantID := c.GetString("tenant_id")
	email := c.GetString("email")
	role := c.GetString("role")

	user := map[string]interface{}{
		"user_id":   userID,
		"tenant_id": tenantID,
		"email":     email,
		"role":      role,
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    user,
		"message": "User information retrieved",
	})
}

// Logout handles user logout
// @Summary Logout
// @Tags auth
// @Success 200 {object} response.Response
// @Security Bearer
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// In a stateless JWT system, logout is typically handled client-side
	// Here we just acknowledge the logout request
	// In a production system, you might want to blacklist the token
	c.JSON(200, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}
