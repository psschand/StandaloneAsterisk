package errors

import (
	"errors"
	"fmt"
	"net/http"
)

// Common errors
var (
	ErrNotFound                = errors.New("resource not found")
	ErrUnauthorized            = errors.New("unauthorized")
	ErrForbidden               = errors.New("forbidden")
	ErrBadRequest              = errors.New("bad request")
	ErrConflict                = errors.New("resource already exists")
	ErrInternal                = errors.New("internal server error")
	ErrValidation              = errors.New("validation error")
	ErrInvalidCredentials      = errors.New("invalid credentials")
	ErrTenantNotFound          = errors.New("tenant not found")
	ErrUserNotFound            = errors.New("user not found")
	ErrInsufficientPermissions = errors.New("insufficient permissions")
)

// AppError represents an application error
type AppError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
	Err     error       `json:"-"`
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

// Unwrap returns the wrapped error
func (e *AppError) Unwrap() error {
	return e.Err
}

// New creates a new AppError
func New(code, message string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
	}
}

// Wrap wraps an error with additional context
func Wrap(err error, codeOrMessage string, messageOptional ...string) *AppError {
	var code, message string

	// If only 2 arguments, use INTERNAL_ERROR as code and second arg as message
	if len(messageOptional) == 0 {
		code = "INTERNAL_ERROR"
		message = codeOrMessage
	} else {
		// If 3 arguments, first is code, second is message
		code = codeOrMessage
		message = messageOptional[0]
	}

	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

// WithDetails adds details to an error
func (e *AppError) WithDetails(details interface{}) *AppError {
	e.Details = details
	return e
}

// NewNotFound creates a not found error
func NewNotFound(resource string) *AppError {
	return &AppError{
		Code:    "NOT_FOUND",
		Message: fmt.Sprintf("%s not found", resource),
		Err:     ErrNotFound,
	}
}

// NewUnauthorized creates an unauthorized error
func NewUnauthorized(message string) *AppError {
	return &AppError{
		Code:    "UNAUTHORIZED",
		Message: message,
		Err:     ErrUnauthorized,
	}
}

// NewForbidden creates a forbidden error
func NewForbidden(message string) *AppError {
	return &AppError{
		Code:    "FORBIDDEN",
		Message: message,
		Err:     ErrForbidden,
	}
}

// NewBadRequest creates a bad request error
func NewBadRequest(message string) *AppError {
	return &AppError{
		Code:    "BAD_REQUEST",
		Message: message,
		Err:     ErrBadRequest,
	}
}

// NewValidation creates a validation error
func NewValidation(details interface{}) *AppError {
	return &AppError{
		Code:    "VALIDATION_ERROR",
		Message: "Validation failed",
		Details: details,
		Err:     ErrValidation,
	}
}

// NewConflict creates a conflict error
func NewConflict(message string) *AppError {
	return &AppError{
		Code:    "CONFLICT",
		Message: message,
		Err:     ErrConflict,
	}
}

// NewInternal creates an internal server error
func NewInternal(message string, err error) *AppError {
	return &AppError{
		Code:    "INTERNAL_ERROR",
		Message: message,
		Err:     err,
	}
}

// GetHTTPStatus returns the appropriate HTTP status code for an error
func GetHTTPStatus(err error) int {
	if err == nil {
		return http.StatusOK
	}

	var appErr *AppError
	if errors.As(err, &appErr) {
		switch {
		case errors.Is(appErr.Err, ErrNotFound):
			return http.StatusNotFound
		case errors.Is(appErr.Err, ErrUnauthorized):
			return http.StatusUnauthorized
		case errors.Is(appErr.Err, ErrForbidden):
			return http.StatusForbidden
		case errors.Is(appErr.Err, ErrBadRequest):
			return http.StatusBadRequest
		case errors.Is(appErr.Err, ErrValidation):
			return http.StatusUnprocessableEntity
		case errors.Is(appErr.Err, ErrConflict):
			return http.StatusConflict
		case errors.Is(appErr.Err, ErrInternal):
			return http.StatusInternalServerError
		}
	}

	return http.StatusInternalServerError
}
