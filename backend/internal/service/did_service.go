package service

import (
	"context"
	"time"

	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
)

// DIDService handles DID (phone number) operations
type DIDService interface {
	Create(ctx context.Context, tenantID string, req *dto.CreateDIDRequest) (*dto.DIDResponse, error)
	GetByID(ctx context.Context, id int64) (*dto.DIDResponse, error)
	GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.DIDResponse, int64, error)
	GetByNumber(ctx context.Context, number string) (*dto.DIDResponse, error)
	Update(ctx context.Context, id int64, req *dto.UpdateDIDRequest) (*dto.DIDResponse, error)
	Delete(ctx context.Context, id int64) error
	UpdateRouting(ctx context.Context, id int64, req *dto.UpdateDIDRoutingRequest) (*dto.DIDResponse, error)
	GetAvailable(ctx context.Context) ([]dto.DIDResponse, error)
}

type didService struct {
	didRepo    repository.DIDRepository
	tenantRepo repository.TenantRepository
	queueRepo  repository.QueueRepository
	userRepo   repository.UserRepository
}

// NewDIDService creates a new DID service
func NewDIDService(
	didRepo repository.DIDRepository,
	tenantRepo repository.TenantRepository,
	queueRepo repository.QueueRepository,
	userRepo repository.UserRepository,
) DIDService {
	return &didService{
		didRepo:    didRepo,
		tenantRepo: tenantRepo,
		queueRepo:  queueRepo,
		userRepo:   userRepo,
	}
}

// Create creates a new DID
func (s *didService) Create(ctx context.Context, tenantID string, req *dto.CreateDIDRequest) (*dto.DIDResponse, error) {
	// Validate tenant exists
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil {
		return nil, errors.NewNotFound("tenant not found")
	}

	// Check resource limits
	counts, err := s.tenantRepo.CountResourcesByTenant(ctx, tenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to check resource limits")
	}

	if counts["dids"] >= tenant.MaxDIDs {
		return nil, errors.NewValidation("tenant has reached maximum DIDs limit")
	}

	// Check if DID number already exists
	existingDID, _ := s.didRepo.FindByNumber(ctx, req.Number)
	if existingDID != nil {
		return nil, errors.NewValidation("DID with this number already exists")
	}

	// Validate routing if provided
	if req.RouteType != "" {
		if err := s.validateRouting(ctx, tenantID, string(req.RouteType), req.RouteTarget); err != nil {
			return nil, err
		}
	}

	// Create DID
	now := time.Now()
	did := &asterisk.DID{
		TenantID:      tenantID,
		Number:        req.Number,
		CountryCode:   req.CountryCode,
		FriendlyName:  req.FriendlyName,
		Status:        common.DIDStatusActive,
		RouteType:     req.RouteType,
		RouteTarget:   req.RouteTarget,
		SMSEnabled:    req.SMSEnabled,
		SMSWebhookURL: req.SMSWebhookURL,
		Metadata:      req.Metadata,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.didRepo.Create(ctx, did); err != nil {
		return nil, errors.Wrap(err, "failed to create DID")
	}

	return s.toDIDResponse(did), nil
}

// GetByID gets a DID by ID
func (s *didService) GetByID(ctx context.Context, id int64) (*dto.DIDResponse, error) {
	did, err := s.didRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("DID not found")
	}

	return s.toDIDResponse(did), nil
}

// GetByTenant gets all DIDs for a tenant
func (s *didService) GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.DIDResponse, int64, error) {
	dids, total, err := s.didRepo.FindByTenant(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get DIDs")
	}

	responses := make([]dto.DIDResponse, len(dids))
	for i, did := range dids {
		responses[i] = *s.toDIDResponse(&did)
	}

	return responses, total, nil
}

// GetByNumber gets a DID by phone number
func (s *didService) GetByNumber(ctx context.Context, number string) (*dto.DIDResponse, error) {
	did, err := s.didRepo.FindByNumber(ctx, number)
	if err != nil {
		return nil, errors.NewNotFound("DID not found")
	}

	return s.toDIDResponse(did), nil
}

// Update updates a DID
func (s *didService) Update(ctx context.Context, id int64, req *dto.UpdateDIDRequest) (*dto.DIDResponse, error) {
	// Get existing DID
	did, err := s.didRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("DID not found")
	}

	// Update fields
	if req.FriendlyName != nil {
		did.FriendlyName = req.FriendlyName
	}
	if req.RouteType != nil {
		did.RouteType = *req.RouteType
	}
	if req.RouteTarget != nil {
		did.RouteTarget = *req.RouteTarget
	}
	if req.SMSEnabled != nil {
		did.SMSEnabled = *req.SMSEnabled
	}
	if req.SMSWebhookURL != nil {
		did.SMSWebhookURL = req.SMSWebhookURL
	}
	if req.Status != nil {
		did.Status = *req.Status
	}
	if req.Metadata != nil {
		did.Metadata = req.Metadata
	}

	did.UpdatedAt = time.Now()

	if err := s.didRepo.Update(ctx, did); err != nil {
		return nil, errors.Wrap(err, "failed to update DID")
	}

	return s.toDIDResponse(did), nil
}

// Delete deletes a DID
func (s *didService) Delete(ctx context.Context, id int64) error {
	// Check if DID exists
	_, err := s.didRepo.FindByID(ctx, id)
	if err != nil {
		return errors.NewNotFound("DID not found")
	}

	if err := s.didRepo.Delete(ctx, id); err != nil {
		return errors.Wrap(err, "failed to delete DID")
	}

	return nil
}

// UpdateRouting updates DID routing configuration
func (s *didService) UpdateRouting(ctx context.Context, id int64, req *dto.UpdateDIDRoutingRequest) (*dto.DIDResponse, error) {
	// Get existing DID
	did, err := s.didRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("DID not found")
	}

	// Validate routing
	if err := s.validateRouting(ctx, did.TenantID, string(req.RouteType), req.RouteTarget); err != nil {
		return nil, err
	}

	// Update routing
	did.RouteType = req.RouteType
	did.RouteTarget = req.RouteTarget
	did.UpdatedAt = time.Now()

	if err := s.didRepo.Update(ctx, did); err != nil {
		return nil, errors.Wrap(err, "failed to update DID routing")
	}

	return s.toDIDResponse(did), nil
}

// GetAvailable gets all available DIDs (not assigned to any tenant)
func (s *didService) GetAvailable(ctx context.Context) ([]dto.DIDResponse, error) {
	dids, err := s.didRepo.FindAvailable(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get available DIDs")
	}

	responses := make([]dto.DIDResponse, len(dids))
	for i, did := range dids {
		responses[i] = *s.toDIDResponse(&did)
	}

	return responses, nil
}

// validateRouting validates routing configuration
func (s *didService) validateRouting(ctx context.Context, tenantID, routeType, routeDestination string) error {
	switch routeType {
	case "queue":
		// Validate queue exists
		if routeDestination == "" {
			return errors.NewValidation("queue name is required for queue routing")
		}
		queue, err := s.queueRepo.FindByName(ctx, tenantID, routeDestination)
		if err != nil || queue == nil {
			return errors.NewValidation("queue not found")
		}
	case "extension":
		// Validate extension exists
		if routeDestination == "" {
			return errors.NewValidation("extension is required for extension routing")
		}
		// TODO: Validate extension exists in tenant
	case "ivr":
		// Validate IVR exists
		if routeDestination == "" {
			return errors.NewValidation("IVR name is required for IVR routing")
		}
		// TODO: Validate IVR exists
	case "voicemail":
		// Validate voicemail box exists
		if routeDestination == "" {
			return errors.NewValidation("voicemail box is required for voicemail routing")
		}
	default:
		if routeType != "" {
			return errors.NewValidation("invalid route type")
		}
	}

	return nil
}

// toDIDResponse converts DID model to response DTO
func (s *didService) toDIDResponse(did *asterisk.DID) *dto.DIDResponse {
	return &dto.DIDResponse{
		ID:            did.ID,
		TenantID:      did.TenantID,
		Number:        did.Number,
		CountryCode:   did.CountryCode,
		FriendlyName:  did.FriendlyName,
		Status:        did.Status,
		RouteType:     did.RouteType,
		RouteTarget:   did.RouteTarget,
		SMSEnabled:    did.SMSEnabled,
		SMSWebhookURL: did.SMSWebhookURL,
		Metadata:      did.Metadata,
		CreatedAt:     did.CreatedAt,
		UpdatedAt:     did.UpdatedAt,
	}
}
