package middleware

import (
	"log"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/psschand/callcenter/internal/config"
	"github.com/psschand/callcenter/pkg/jwt"
	"github.com/psschand/callcenter/pkg/response"
)

// RequestID middleware adds a unique request ID to each request
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)
		c.Next()
	}
}

// CORS middleware handles Cross-Origin Resource Sharing
func CORS(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range cfg.CORS.AllowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Methods", strings.Join(cfg.CORS.AllowedMethods, ", "))
			c.Header("Access-Control-Allow-Headers", strings.Join(cfg.CORS.AllowedHeaders, ", "))
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Max-Age", "86400")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Auth middleware validates JWT tokens
func Auth(jwtService *jwt.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("========== [Auth Middleware] Called for path: %s ==========", c.Request.URL.Path)
		// Try to get token from Authorization header first
		authHeader := c.GetHeader("Authorization")
		var tokenString string
		var err error

		if authHeader != "" {
			tokenString, err = jwt.ExtractToken(authHeader)
			if err != nil {
				log.Printf("[Auth] Error extracting token from header: %v", err)
				response.Unauthorized(c, "Invalid authorization header format")
				c.Abort()
				return
			}
		} else {
			// For WebSocket connections, try to get token from query parameter
			tokenString = c.Query("token")
			if tokenString == "" {
				log.Printf("[Auth] No token found in header or query parameter for path: %s", c.Request.URL.Path)
				response.Unauthorized(c, "Authorization required")
				c.Abort()
				return
			}
			log.Printf("[Auth] Using token from query parameter for path: %s", c.Request.URL.Path)
		}

		claims, err := jwtService.ValidateAccessToken(tokenString)
		if err != nil {
			log.Printf("[Auth] Token validation failed for path %s: %v", c.Request.URL.Path, err)
			response.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		log.Printf("[Auth] Token validated successfully for user %d on path: %s", claims.UserID, c.Request.URL.Path)

		// Set user info in context
		c.Set("user_id", claims.UserID)
		c.Set("tenant_id", claims.TenantID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// TenantIsolation middleware ensures tenant isolation
func TenantIsolation() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID := c.GetString("tenant_id")
		if tenantID == "" {
			response.Forbidden(c, "Tenant context is required")
			c.Abort()
			return
		}

		// Tenant ID is already set by Auth middleware
		c.Next()
	}
}

// RequireRole middleware checks if user has required role
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("role")
		if userRole == "" {
			response.Forbidden(c, "Role information not found")
			c.Abort()
			return
		}

		// Check if user has one of the required roles
		hasRole := false
		for _, role := range roles {
			if userRole == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			response.Forbidden(c, "Insufficient permissions")
			c.Abort()
			return
		}

		c.Next()
	}
}

// Recovery middleware recovers from panics
func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(error); ok {
			response.InternalError(c, err.Error())
		} else {
			response.InternalError(c, "Internal server error")
		}
		c.Abort()
	})
}
