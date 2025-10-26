package service

import (
	"context"
	"time"

	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
)

// CDRService handles CDR (Call Detail Record) operations
type CDRService interface {
	GetByID(ctx context.Context, id int64) (*dto.CDRResponse, error)
	GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.CDRResponse, int64, error)
	GetByDateRange(ctx context.Context, tenantID string, start, end time.Time, page, pageSize int) ([]dto.CDRResponse, int64, error)
	GetByUser(ctx context.Context, tenantID string, userID int64, page, pageSize int) ([]dto.CDRResponse, int64, error)
	GetByQueue(ctx context.Context, tenantID string, queueName string, page, pageSize int) ([]dto.CDRResponse, int64, error)
	GetStats(ctx context.Context, tenantID string, start, end time.Time) (*dto.CDRStatsResponse, error)
	GetCallVolumeByHour(ctx context.Context, tenantID string, date time.Time) ([]dto.CallVolumeResponse, error)
}

type cdrService struct {
	cdrRepo  repository.CDRRepository
	userRepo repository.UserRepository
}

// NewCDRService creates a new CDR service
func NewCDRService(cdrRepo repository.CDRRepository, userRepo repository.UserRepository) CDRService {
	return &cdrService{
		cdrRepo:  cdrRepo,
		userRepo: userRepo,
	}
}

// GetByID gets a CDR by ID
func (s *cdrService) GetByID(ctx context.Context, id int64) (*dto.CDRResponse, error) {
	cdr, err := s.cdrRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get CDR")
	}

	return s.toCDRResponse(cdr)
}

// toCDRResponse converts a CDR model to response DTO
func (s *cdrService) toCDRResponse(cdr *asterisk.CDR) (*dto.CDRResponse, error) {
	if cdr == nil {
		return nil, errors.New("INVALID_CDR", "cdr cannot be nil")
	}

	// Get agent name if UserID is set
	var agentName *string
	if cdr.UserID != nil {
		user, err := s.userRepo.FindByID(context.Background(), *cdr.UserID)
		if err == nil && user.FirstName != nil {
			name := ""
			if user.FirstName != nil {
				name = *user.FirstName
			}
			if user.LastName != nil {
				if name != "" {
					name += " "
				}
				name += *user.LastName
			}
			if name != "" {
				agentName = &name
			}
		}
	}

	return &dto.CDRResponse{
		ID:            cdr.ID,
		TenantID:      cdr.TenantID,
		CallDate:      cdr.CallDate,
		CLID:          cdr.CLID,
		Src:           cdr.Src,
		Dst:           cdr.Dst,
		Duration:      cdr.Duration,
		BillSec:       cdr.BillSec,
		Disposition:   cdr.Disposition,
		RecordingFile: cdr.RecordingFile,
		QueueName:     cdr.QueueName,
		QueueWaitTime: cdr.QueueWaitTime,
		AgentName:     agentName,
		Metadata:      cdr.Metadata,
	}, nil
}

// GetByTenant gets all CDRs for a tenant
func (s *cdrService) GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.CDRResponse, int64, error) {
	cdrs, total, err := s.cdrRepo.FindByTenant(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get CDRs")
	}

	return s.toCDRResponses(cdrs), total, nil
}

// GetByDateRange gets CDRs by date range
func (s *cdrService) GetByDateRange(ctx context.Context, tenantID string, start, end time.Time, page, pageSize int) ([]dto.CDRResponse, int64, error) {
	cdrs, total, err := s.cdrRepo.FindByDateRange(ctx, tenantID, start, end, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get CDRs by date range")
	}

	return s.toCDRResponses(cdrs), total, nil
}

// GetByUser gets CDRs for a specific user
func (s *cdrService) GetByUser(ctx context.Context, tenantID string, userID int64, page, pageSize int) ([]dto.CDRResponse, int64, error) {
	// Repository FindByUser takes userID only, filter by tenantID here
	cdrs, _, err := s.cdrRepo.FindByUser(ctx, userID, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get user CDRs")
	}

	// Filter by tenantID
	filtered := []asterisk.CDR{}
	for _, cdr := range cdrs {
		if cdr.TenantID == tenantID {
			filtered = append(filtered, cdr)
		}
	}

	return s.toCDRResponses(filtered), int64(len(filtered)), nil
}

// GetByQueue gets CDRs for a specific queue
func (s *cdrService) GetByQueue(ctx context.Context, tenantID string, queueName string, page, pageSize int) ([]dto.CDRResponse, int64, error) {
	cdrs, total, err := s.cdrRepo.FindByQueue(ctx, tenantID, queueName, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get queue CDRs")
	}

	return s.toCDRResponses(cdrs), total, nil
}

// GetStats gets CDR statistics
func (s *cdrService) GetStats(ctx context.Context, tenantID string, start, end time.Time) (*dto.CDRStatsResponse, error) {
	stats, err := s.cdrRepo.GetStats(ctx, tenantID, start, end)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get CDR stats")
	}

	totalCalls := int(stats["total_calls"].(int64))
	answeredCalls := int(stats["answered_calls"].(int64))
	missedCalls := 0
	busyCalls := 0
	// Try to get these if available
	if v, ok := stats["missed_calls"].(int64); ok {
		missedCalls = int(v)
	}
	if v, ok := stats["busy_calls"].(int64); ok {
		busyCalls = int(v)
	}

	return &dto.CDRStatsResponse{
		TotalCalls:      totalCalls,
		AnsweredCalls:   answeredCalls,
		MissedCalls:     missedCalls,
		BusyCalls:       busyCalls,
		AverageDuration: stats["avg_duration"].(float64),
		AverageWaitTime: 0, // TODO: Add if available
		TotalDuration:   0, // TODO: Calculate from stats
		AnswerRate:      stats["answer_rate"].(float64),
	}, nil
}

// GetCallVolumeByHour gets call volume by hour
func (s *cdrService) GetCallVolumeByHour(ctx context.Context, tenantID string, date time.Time) ([]dto.CallVolumeResponse, error) {
	// Set date for the day
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())

	volumes, err := s.cdrRepo.GetCallVolumeByHour(ctx, tenantID, start)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get call volume")
	}

	responses := make([]dto.CallVolumeResponse, len(volumes))
	for i, vol := range volumes {
		totalCalls := int(vol["total_calls"].(int64))
		answered := int(vol["answered"].(int64))
		missed := totalCalls - answered
		if v, ok := vol["missed"].(int64); ok {
			missed = int(v)
		}

		responses[i] = dto.CallVolumeResponse{
			Hour:            vol["hour"].(int),
			TotalCalls:      totalCalls,
			Answered:        answered,
			Missed:          missed,
			AverageDuration: vol["avg_duration"].(float64),
		}
	}

	return responses, nil
}

// toCDRResponses converts CDR models to response DTOs
func (s *cdrService) toCDRResponses(cdrs []asterisk.CDR) []dto.CDRResponse {
	responses := make([]dto.CDRResponse, 0, len(cdrs))
	for _, cdr := range cdrs {
		cdrCopy := cdr // Make a copy to take address
		resp, err := s.toCDRResponse(&cdrCopy)
		if err == nil && resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}
