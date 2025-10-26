package response

import (
	stderrors "errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/psschand/callcenter/pkg/errors"
)

// Response represents a standard API response
type Response struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     *ErrorInfo  `json:"error,omitempty"`
	Meta      *Meta       `json:"meta,omitempty"`
	RequestID string      `json:"request_id"`
	Timestamp string      `json:"timestamp"`
}

// ErrorInfo represents error information in the response
type ErrorInfo struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Meta represents metadata for responses (e.g., pagination)
type Meta struct {
	Page       int `json:"page,omitempty"`
	PageSize   int `json:"page_size,omitempty"`
	TotalPages int `json:"total_pages,omitempty"`
	TotalCount int `json:"total_count,omitempty"`
}

// Success sends a successful response
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Success:   true,
		Data:      data,
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// SuccessWithMeta sends a successful response with metadata
func SuccessWithMeta(c *gin.Context, data interface{}, meta *Meta) {
	c.JSON(http.StatusOK, Response{
		Success:   true,
		Data:      data,
		Meta:      meta,
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// Created sends a 201 Created response
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{
		Success:   true,
		Data:      data,
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// NoContent sends a 204 No Content response
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// Error sends an error response
func Error(c *gin.Context, err error) {
	var appErr *errors.AppError
	var errorInfo *ErrorInfo

	if stderrors.As(err, &appErr) {
		errorInfo = &ErrorInfo{
			Code:    appErr.Code,
			Message: appErr.Message,
			Details: appErr.Details,
		}
	} else {
		errorInfo = &ErrorInfo{
			Code:    "INTERNAL_ERROR",
			Message: err.Error(),
		}
	}

	statusCode := errors.GetHTTPStatus(err)

	c.JSON(statusCode, Response{
		Success:   false,
		Error:     errorInfo,
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// BadRequest sends a 400 Bad Request response
func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "BAD_REQUEST",
			Message: message,
		},
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "UNAUTHORIZED",
			Message: message,
		},
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// Forbidden sends a 403 Forbidden response
func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "FORBIDDEN",
			Message: message,
		},
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// NotFound sends a 404 Not Found response
func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "NOT_FOUND",
			Message: message,
		},
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// ValidationError sends a 422 Unprocessable Entity response with validation errors
func ValidationError(c *gin.Context, details interface{}) {
	c.JSON(http.StatusUnprocessableEntity, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "VALIDATION_ERROR",
			Message: "Validation failed",
			Details: details,
		},
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// InternalError sends a 500 Internal Server Error response
func InternalError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "INTERNAL_ERROR",
			Message: message,
		},
		RequestID: getRequestID(c),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// getRequestID gets or generates a request ID
func getRequestID(c *gin.Context) string {
	requestID := c.GetString("request_id")
	if requestID == "" {
		requestID = uuid.New().String()
	}
	return requestID
}

// NewMeta creates pagination metadata
func NewMeta(page, pageSize, totalCount int) *Meta {
	totalPages := (totalCount + pageSize - 1) / pageSize
	return &Meta{
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
		TotalCount: totalCount,
	}
}
