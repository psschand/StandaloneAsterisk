package service

import (
	"context"
	"strings"
	"time"

	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
)

// IVRService exposes IVR menu operations.
type IVRService interface {
	Create(ctx context.Context, tenantID string, req *dto.CreateIVRMenuRequest) (*dto.IVRMenuResponse, error)
	Update(ctx context.Context, tenantID string, id int64, req *dto.UpdateIVRMenuRequest) (*dto.IVRMenuResponse, error)
	Delete(ctx context.Context, tenantID string, id int64) error
	Get(ctx context.Context, tenantID string, id int64) (*dto.IVRMenuResponse, error)
	List(ctx context.Context, tenantID string) ([]dto.IVRMenuResponse, error)
}

type ivrService struct {
	repo repository.IVRMenuRepository
}

// NewIVRService constructs a new IVR service.
func NewIVRService(repo repository.IVRMenuRepository) IVRService {
	return &ivrService{repo: repo}
}

func (s *ivrService) Create(ctx context.Context, tenantID string, req *dto.CreateIVRMenuRequest) (*dto.IVRMenuResponse, error) {
	if existing, err := s.repo.FindByName(ctx, tenantID, req.Name); err == nil && existing != nil {
		return nil, errors.NewValidation("ivr menu with this name already exists")
	}

	menu := s.mapCreateRequestToModel(tenantID, req)
	menu.CreatedAt = time.Now()
	menu.UpdatedAt = menu.CreatedAt

	if err := s.repo.Create(ctx, menu); err != nil {
		return nil, errors.Wrap(err, "failed to create IVR menu")
	}

	created, err := s.repo.FindByID(ctx, tenantID, menu.ID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to fetch created IVR menu")
	}

	return s.toResponse(created), nil
}

func (s *ivrService) Update(ctx context.Context, tenantID string, id int64, req *dto.UpdateIVRMenuRequest) (*dto.IVRMenuResponse, error) {
	existing, err := s.repo.FindByID(ctx, tenantID, id)
	if err != nil {
		return nil, errors.NewNotFound("ivr menu not found")
	}

	// Maintain name uniqueness if attempting to change name (not currently supported via request)
	if req.DisplayName != nil {
		existing.DisplayName = req.DisplayName
	}
	if req.Description != nil {
		existing.Description = trimPtr(req.Description)
	}
	if req.GreetingText != nil {
		existing.GreetingText = trimPtr(req.GreetingText)
	}
	if req.GreetingAudioURL != nil {
		existing.GreetingAudioURL = trimPtr(req.GreetingAudioURL)
	}
	if req.Timeout != nil {
		existing.Timeout = *req.Timeout
	}
	if req.MaxAttempts != nil {
		existing.MaxAttempts = *req.MaxAttempts
	}
	if req.Status != nil {
		existing.Status = *req.Status
		existing.IsActive = strings.EqualFold(*req.Status, "active")
	}
	if req.InvalidOptionAction != nil {
		existing.InvalidOptionAction = *req.InvalidOptionAction
	}
	if req.TimeoutAction != nil {
		existing.TimeoutAction = *req.TimeoutAction
	}

	if req.Options != nil {
		if len(req.Options) > 0 {
			existing.Options = s.mapOptions(req.Options)
		} else {
			existing.Options = []asterisk.IVROption{}
		}
	}

	existing.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, errors.Wrap(err, "failed to update IVR menu")
	}

	updated, err := s.repo.FindByID(ctx, tenantID, id)
	if err != nil {
		return nil, errors.Wrap(err, "failed to fetch updated IVR menu")
	}

	return s.toResponse(updated), nil
}

func (s *ivrService) Delete(ctx context.Context, tenantID string, id int64) error {
	if err := s.repo.Delete(ctx, tenantID, id); err != nil {
		return errors.Wrap(err, "failed to delete IVR menu")
	}
	return nil
}

func (s *ivrService) Get(ctx context.Context, tenantID string, id int64) (*dto.IVRMenuResponse, error) {
	menu, err := s.repo.FindByID(ctx, tenantID, id)
	if err != nil {
		return nil, errors.NewNotFound("ivr menu not found")
	}
	return s.toResponse(menu), nil
}

func (s *ivrService) List(ctx context.Context, tenantID string) ([]dto.IVRMenuResponse, error) {
	menus, err := s.repo.FindByTenant(ctx, tenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to list IVR menus")
	}

	responses := make([]dto.IVRMenuResponse, len(menus))
	for i := range menus {
		responses[i] = *s.toResponse(&menus[i])
	}
	return responses, nil
}

func (s *ivrService) mapCreateRequestToModel(tenantID string, req *dto.CreateIVRMenuRequest) *asterisk.IVRMenu {
	menu := &asterisk.IVRMenu{
		TenantID:            tenantID,
		Name:                req.Name,
		DisplayName:         req.DisplayName,
		Description:         trimPtr(req.Description),
		GreetingText:        trimPtr(req.GreetingText),
		GreetingAudioURL:    trimPtr(req.GreetingAudioURL),
		Timeout:             defaultInt(req.Timeout, 10),
		MaxAttempts:         defaultInt(req.MaxAttempts, 3),
		Status:              defaultString(req.Status, "active"),
		InvalidOptionAction: defaultString(req.InvalidOptionAction, "repeat"),
		TimeoutAction:       defaultString(req.TimeoutAction, "repeat"),
	}
	menu.IsActive = strings.EqualFold(menu.Status, "active")
	menu.Options = s.mapOptions(req.Options)
	return menu
}

func (s *ivrService) mapOptions(payload []dto.IVROptionPayload) []asterisk.IVROption {
	options := make([]asterisk.IVROption, len(payload))
	for i := range payload {
		opt := payload[i]
		options[i] = asterisk.IVROption{
			Digit:       strings.TrimSpace(opt.Digit),
			Action:      strings.TrimSpace(opt.ActionType),
			ActionData:  optionalString(opt.ActionTarget),
			Description: optionalString(opt.Description),
			SortOrder:   i,
		}
	}
	return options
}

func (s *ivrService) toResponse(menu *asterisk.IVRMenu) *dto.IVRMenuResponse {
	options := make([]dto.IVROptionPayload, len(menu.Options))
	for i := range menu.Options {
		opt := menu.Options[i]
		options[i] = dto.IVROptionPayload{
			ID:           &opt.ID,
			Digit:        opt.Digit,
			ActionType:   opt.Action,
			ActionTarget: stringOrEmpty(opt.ActionData),
			Description:  stringOrEmpty(opt.Description),
		}
	}

	return &dto.IVRMenuResponse{
		ID:                  menu.ID,
		TenantID:            menu.TenantID,
		Name:                menu.Name,
		DisplayName:         menu.DisplayName,
		Description:         menu.Description,
		GreetingText:        menu.GreetingText,
		GreetingAudioURL:    menu.GreetingAudioURL,
		Timeout:             menu.Timeout,
		MaxAttempts:         menu.MaxAttempts,
		Status:              menu.Status,
		InvalidOptionAction: menu.InvalidOptionAction,
		TimeoutAction:       menu.TimeoutAction,
		Options:             options,
		CreatedAt:           menu.CreatedAt,
		UpdatedAt:           menu.UpdatedAt,
	}
}

func defaultInt(value, fallback int) int {
	if value == 0 {
		return fallback
	}
	return value
}

func defaultString(value, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	return value
}

func trimPtr(ptr *string) *string {
	if ptr == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*ptr)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func optionalString(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func stringOrEmpty(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}
