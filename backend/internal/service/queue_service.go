package service

import (
	"context"
	"time"

	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
)

// QueueService handles queue operations
type QueueService interface {
	Create(ctx context.Context, tenantID string, req *dto.CreateQueueRequest) (*dto.QueueResponse, error)
	GetByID(ctx context.Context, id int64) (*dto.QueueResponse, error)
	GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.QueueResponse, int64, error)
	Update(ctx context.Context, id int64, req *dto.UpdateQueueRequest) (*dto.QueueResponse, error)
	Delete(ctx context.Context, id int64) error
	AddMember(ctx context.Context, queueID, userID int64, req *dto.AddQueueMemberRequest) error
	RemoveMember(ctx context.Context, queueID, userID int64) error
	GetMembers(ctx context.Context, queueID int64) ([]dto.QueueMemberResponse, error)
	UpdateMember(ctx context.Context, memberID int64, req *dto.UpdateQueueMemberRequest) error
}

type queueService struct {
	queueRepo       repository.QueueRepository
	queueMemberRepo repository.QueueMemberRepository
	tenantRepo      repository.TenantRepository
	userRepo        repository.UserRepository
	userRoleRepo    repository.UserRoleRepository
}

// NewQueueService creates a new queue service
func NewQueueService(
	queueRepo repository.QueueRepository,
	queueMemberRepo repository.QueueMemberRepository,
	tenantRepo repository.TenantRepository,
	userRepo repository.UserRepository,
	userRoleRepo repository.UserRoleRepository,
) QueueService {
	return &queueService{
		queueRepo:       queueRepo,
		queueMemberRepo: queueMemberRepo,
		tenantRepo:      tenantRepo,
		userRepo:        userRepo,
		userRoleRepo:    userRoleRepo,
	}
}

// Create creates a new queue
func (s *queueService) Create(ctx context.Context, tenantID string, req *dto.CreateQueueRequest) (*dto.QueueResponse, error) {
	// Validate tenant exists
	tenant, err := s.tenantRepo.FindByID(ctx, tenantID)
	if err != nil {
		return nil, errors.NewNotFound("tenant not found")
	}

	// Check resource limits (optional - tenant may not have MaxQueues limit)
	counts, err := s.tenantRepo.CountResourcesByTenant(ctx, tenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to check resource limits")
	}

	// Check if tenant has a queue limit (optional feature)
	_ = counts // Use counts if implementing limits
	_ = tenant // Tenant validated above

	// Check if queue name already exists
	existingQueue, _ := s.queueRepo.FindByName(ctx, tenantID, req.Name)
	if existingQueue != nil {
		return nil, errors.NewValidation("queue with this name already exists")
	}

	// Create queue with defaults
	now := time.Now()
	queue := &asterisk.Queue{
		TenantID:          tenantID,
		Name:              req.Name,
		DisplayName:       req.DisplayName,
		Strategy:          req.Strategy,
		Timeout:           req.Timeout,
		Retry:             req.Retry,
		MaxWaitTime:       req.MaxWaitTime,
		MaxLen:            req.MaxLen,
		AnnounceFrequency: req.AnnounceFrequency,
		AnnounceHoldTime:  req.AnnounceHoldTime,
		MusicOnHold:       req.MusicOnHold,
		Status:            "active",
		Metadata:          req.Metadata,
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	// Set defaults if not provided
	if queue.Strategy == "" {
		queue.Strategy = "ringall"
	}
	if queue.Timeout == 0 {
		queue.Timeout = 30
	}
	if queue.Retry == 0 {
		queue.Retry = 5
	}
	if queue.MaxWaitTime == 0 {
		queue.MaxWaitTime = 300
	}

	if err := s.queueRepo.Create(ctx, queue); err != nil {
		return nil, errors.Wrap(err, "failed to create queue")
	}

	return s.toQueueResponse(queue), nil
}

// GetByID gets a queue by ID
func (s *queueService) GetByID(ctx context.Context, id int64) (*dto.QueueResponse, error) {
	queue, err := s.queueRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("queue not found")
	}

	return s.toQueueResponse(queue), nil
}

// GetByTenant gets all queues for a tenant
func (s *queueService) GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.QueueResponse, int64, error) {
	queues, total, err := s.queueRepo.FindByTenant(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get queues")
	}

	responses := make([]dto.QueueResponse, len(queues))
	for i, queue := range queues {
		responses[i] = *s.toQueueResponse(&queue)
	}

	return responses, total, nil
}

// Update updates a queue
func (s *queueService) Update(ctx context.Context, id int64, req *dto.UpdateQueueRequest) (*dto.QueueResponse, error) {
	// Get existing queue
	queue, err := s.queueRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("queue not found")
	}

	// Update fields (check for pointers)
	if req.DisplayName != nil {
		queue.DisplayName = *req.DisplayName
	}
	if req.Strategy != nil {
		queue.Strategy = *req.Strategy
	}
	if req.Timeout != nil {
		queue.Timeout = *req.Timeout
	}
	if req.Retry != nil {
		queue.Retry = *req.Retry
	}
	if req.MaxWaitTime != nil {
		queue.MaxWaitTime = *req.MaxWaitTime
	}
	if req.MaxLen != nil {
		queue.MaxLen = *req.MaxLen
	}
	if req.AnnounceFrequency != nil {
		queue.AnnounceFrequency = *req.AnnounceFrequency
	}
	if req.AnnounceHoldTime != nil {
		queue.AnnounceHoldTime = *req.AnnounceHoldTime
	}
	if req.MusicOnHold != nil {
		queue.MusicOnHold = *req.MusicOnHold
	}
	if req.Status != nil {
		queue.Status = *req.Status
	}
	if req.Metadata != nil {
		queue.Metadata = req.Metadata
	}

	queue.UpdatedAt = time.Now()

	if err := s.queueRepo.Update(ctx, queue); err != nil {
		return nil, errors.Wrap(err, "failed to update queue")
	}

	return s.toQueueResponse(queue), nil
}

// Delete deletes a queue
func (s *queueService) Delete(ctx context.Context, id int64) error {
	// Check if queue exists
	_, err := s.queueRepo.FindByID(ctx, id)
	if err != nil {
		return errors.NewNotFound("queue not found")
	}

	// TODO: Check if queue has active calls

	if err := s.queueRepo.Delete(ctx, id); err != nil {
		return errors.Wrap(err, "failed to delete queue")
	}

	return nil
}

// AddMember adds a member to a queue
func (s *queueService) AddMember(ctx context.Context, queueID, userID int64, req *dto.AddQueueMemberRequest) error {
	// Validate queue exists
	queue, err := s.queueRepo.FindByID(ctx, queueID)
	if err != nil {
		return errors.NewNotFound("queue not found")
	}

	// Validate user exists
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return errors.NewNotFound("user not found")
	}

	// Get user's role in this tenant to check tenant access and get endpoint
	userRole, err := s.userRoleRepo.FindByUserAndTenant(ctx, userID, queue.TenantID)
	if err != nil {
		return errors.NewValidation("user does not belong to the same tenant as queue")
	}

	// Check if endpoint is configured
	if userRole.EndpointID == nil || *userRole.EndpointID == "" {
		return errors.NewValidation("user does not have an endpoint configured")
	}

	// Check if user is already a member
	existingMembers, _ := s.queueMemberRepo.FindByUser(ctx, userID)
	for _, member := range existingMembers {
		if member.QueueName == queue.Name {
			return errors.NewValidation("user is already a member of this queue")
		}
	}

	// Create member name
	var memberName string
	if user.FirstName != nil {
		memberName = *user.FirstName
		if user.LastName != nil {
			memberName += " " + *user.LastName
		}
	} else {
		memberName = user.Email
	}

	member := &asterisk.QueueMember{
		TenantID:   queue.TenantID,
		QueueName:  queue.Name,
		Interface:  "PJSIP/" + *userRole.EndpointID,
		MemberName: &memberName,
		Penalty:    req.Penalty,
		Paused:     0, // 0 = not paused, 1 = paused
	}

	if err := s.queueMemberRepo.Create(ctx, member); err != nil {
		return errors.Wrap(err, "failed to add queue member")
	}

	return nil
} // RemoveMember removes a member from a queue
func (s *queueService) RemoveMember(ctx context.Context, queueID, userID int64) error {
	// Validate queue exists
	_, err := s.queueRepo.FindByID(ctx, queueID)
	if err != nil {
		return errors.NewNotFound("queue not found")
	}

	if err := s.queueMemberRepo.RemoveUserFromQueue(ctx, queueID, userID); err != nil {
		return errors.Wrap(err, "failed to remove queue member")
	}

	return nil
}

// GetMembers gets all members of a queue
func (s *queueService) GetMembers(ctx context.Context, queueID int64) ([]dto.QueueMemberResponse, error) {
	// Validate queue exists
	_, err := s.queueRepo.FindByID(ctx, queueID)
	if err != nil {
		return nil, errors.NewNotFound("queue not found")
	}

	members, err := s.queueMemberRepo.FindByQueue(ctx, queueID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get queue members")
	}

	responses := make([]dto.QueueMemberResponse, len(members))
	for i, member := range members {
		responses[i] = dto.QueueMemberResponse{
			UniqueID:       member.UniqueID,
			TenantID:       member.TenantID,
			QueueName:      member.QueueName,
			Interface:      member.Interface,
			MemberName:     member.MemberName,
			StateInterface: member.StateInterface,
			Penalty:        member.Penalty,
			Paused:         member.Paused,
			WrapupTime:     member.WrapupTime,
		}
	}

	return responses, nil
}

// UpdateMember updates a queue member
func (s *queueService) UpdateMember(ctx context.Context, memberID int64, req *dto.UpdateQueueMemberRequest) error {
	// Get existing member
	member, err := s.queueMemberRepo.FindByID(ctx, memberID)
	if err != nil {
		return errors.NewNotFound("queue member not found")
	}

	// Update fields
	if req.Penalty != nil && *req.Penalty >= 0 {
		member.Penalty = *req.Penalty
	}
	if req.Paused != nil {
		member.Paused = *req.Paused
	}
	if req.WrapupTime != nil && *req.WrapupTime >= 0 {
		member.WrapupTime = *req.WrapupTime
	}

	if err := s.queueMemberRepo.Update(ctx, member); err != nil {
		return errors.Wrap(err, "failed to update queue member")
	}

	return nil
}

// toQueueResponse converts Queue model to response DTO
func (s *queueService) toQueueResponse(queue *asterisk.Queue) *dto.QueueResponse {
	return &dto.QueueResponse{
		ID:                queue.ID,
		TenantID:          queue.TenantID,
		Name:              queue.Name,
		DisplayName:       queue.DisplayName,
		Strategy:          queue.Strategy,
		Timeout:           queue.Timeout,
		Retry:             queue.Retry,
		MaxWaitTime:       queue.MaxWaitTime,
		MaxLen:            queue.MaxLen,
		AnnounceFrequency: queue.AnnounceFrequency,
		AnnounceHoldTime:  queue.AnnounceHoldTime,
		MusicOnHold:       queue.MusicOnHold,
		Status:            queue.Status,
		Metadata:          queue.Metadata,
		CreatedAt:         queue.CreatedAt,
		UpdatedAt:         queue.UpdatedAt,
	}
}
