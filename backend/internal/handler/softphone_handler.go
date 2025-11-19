package handler

import (
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
)

type SoftphoneHandler struct {
	endpointRepo repository.PsEndpointRepository
	authRepo     repository.PsAuthRepository
	userRepo     repository.UserRepository
	userRoleRepo repository.UserRoleRepository
}

func NewSoftphoneHandler(
	endpointRepo repository.PsEndpointRepository,
	authRepo repository.PsAuthRepository,
	userRepo repository.UserRepository,
	userRoleRepo repository.UserRoleRepository,
) *SoftphoneHandler {
	return &SoftphoneHandler{
		endpointRepo: endpointRepo,
		authRepo:     authRepo,
		userRepo:     userRepo,
		userRoleRepo: userRoleRepo,
	}
}

// GetCredentials returns SIP credentials for the authenticated user
func (h *SoftphoneHandler) GetCredentials(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Code:    "UNAUTHORIZED",
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	// Convert userID to int64
	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Invalid user ID type",
			Message: "Failed to process user ID",
		})
		return
	}

	println("[Softphone] Getting credentials for user ID:", uid)

	ctx := c.Request.Context()

	// Get user's roles to find their extension
	roles, err := h.userRoleRepo.FindByUser(ctx, uid)
	if err != nil || len(roles) == 0 {
		println("[Softphone] ERROR: No roles found for user", uid, "error:", err)
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Code:    "NOT_FOUND",
			Error:   "User roles not found",
			Message: "User account has no roles assigned",
		})
		return
	}

	println("[Softphone] Found", len(roles), "roles for user", uid)

	// Find the first role with an extension assigned
	var extensionID string
	for _, role := range roles {
		if role.Extension != nil && *role.Extension != "" {
			extensionID = *role.Extension
			break
		}
	}

	// Check if user has an extension assigned
	if extensionID == "" {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Code:    "NO_EXTENSION",
			Error:   "No extension assigned",
			Message: "This user does not have a SIP extension assigned",
		})
		return
	}

	// Get the endpoint for this user's extension
	endpoint, err := h.endpointRepo.FindByID(ctx, extensionID)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Code:    "NOT_FOUND",
			Error:   "Extension not found",
			Message: "No SIP extension found for this user",
		})
		return
	}

	// Get auth credentials - use the auth ID from the endpoint configuration
	// The endpoint.Auth field contains the correct auth ID (e.g., "agent101-auth")
	var auth *asterisk.PsAuth

	// First, try using the auth ID specified in the endpoint
	if endpoint.Auth != nil && *endpoint.Auth != "" {
		auth, err = h.authRepo.FindByID(ctx, *endpoint.Auth)
	}

	// Fallback: try the extension ID directly, then with -auth suffix
	if auth == nil {
		auth, err = h.authRepo.FindByID(ctx, extensionID)
		if err != nil {
			// Try with -auth suffix (common Asterisk pattern)
			auth, err = h.authRepo.FindByID(ctx, extensionID+"-auth")
			if err != nil {
				c.JSON(http.StatusNotFound, dto.ErrorResponse{
					Code:    "NOT_FOUND",
					Error:   "Auth not found",
					Message: "No SIP credentials found for this extension",
				})
				return
			}
		}
	} // Build credentials response
	// Allow deployment to override connection details for WebRTC clients.
	domain := os.Getenv("SOFTPHONE_DOMAIN")
	if domain == "" {
		domain = "app.soham.top"
	}
	proxy := os.Getenv("SOFTPHONE_PROXY_HOST")
	if proxy == "" {
		proxy = domain
	}
	port := 443
	if portStr := os.Getenv("SOFTPHONE_PROXY_PORT"); portStr != "" {
		if parsedPort, err := strconv.Atoi(portStr); err == nil {
			port = parsedPort
		}
	}

	// Dereference pointers for username and password
	username := ""
	password := ""
	if auth.Username != nil {
		username = *auth.Username
	}
	if auth.Password != nil {
		password = *auth.Password
	}

	credentials := gin.H{
		"username":  username, // Use auth username (e.g., "agent101")
		"password":  password, // Auth password
		"domain":    domain,
		"proxy":     proxy,
		"port":      port,
		"transport": "WSS",       // Use WebSocket Secure (wss://) - Caddy proxies to Asterisk
		"extension": endpoint.ID, // Extension ID (e.g., "1001")
	}

	println("[Softphone] Returning credentials - extension:", endpoint.ID, "username:", username)

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Credentials retrieved successfully",
		Data:    credentials,
	})
}

// GetStatus returns the registration status of the softphone
func (h *SoftphoneHandler) GetStatus(c *gin.Context) {
	username, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Code:    "UNAUTHORIZED",
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	usernameStr, ok := username.(string)
	if !ok {
		usernameStr = "agent100" // Default fallback
	}

	// TODO: Check actual registration status from Asterisk ARI
	// For now, return a mock status
	status := gin.H{
		"registered": false,
		"extension":  usernameStr,
		"contact":    "",
		"expires":    0,
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Status retrieved successfully",
		Data:    status,
	})
}
