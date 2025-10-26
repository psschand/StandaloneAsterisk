package service

import (
	"context"
	"fmt"
	"time"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/helpdesk"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
)

// TicketService handles ticket operations
type TicketService interface {
	Create(ctx context.Context, tenantID string, req *dto.CreateTicketRequest) (*dto.TicketResponse, error)
	GetByID(ctx context.Context, id int64) (*dto.TicketResponse, error)
	GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.TicketResponse, int64, error)
	GetByStatus(ctx context.Context, tenantID string, status common.TicketStatus, page, pageSize int) ([]dto.TicketResponse, int64, error)
	GetByAssignee(ctx context.Context, assigneeID int64, page, pageSize int) ([]dto.TicketResponse, int64, error)
	Update(ctx context.Context, id int64, req *dto.UpdateTicketRequest) (*dto.TicketResponse, error)
	Delete(ctx context.Context, id int64) error
	Assign(ctx context.Context, ticketID, assigneeID int64) error
	UpdateStatus(ctx context.Context, ticketID int64, status common.TicketStatus) error
	AddMessage(ctx context.Context, ticketID int64, req *dto.AddTicketMessageRequest) (*dto.TicketMessageResponse, error)
	GetMessages(ctx context.Context, ticketID int64) ([]dto.TicketMessageResponse, error)
	Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]dto.TicketResponse, int64, error)
	GetStats(ctx context.Context, tenantID string, start, end time.Time) (*dto.TicketStatsResponse, error)
	GetOverdue(ctx context.Context, tenantID string) ([]dto.TicketResponse, error)
}

type ticketService struct {
	ticketRepo        repository.TicketRepository
	ticketMessageRepo repository.TicketMessageRepository
	contactRepo       repository.ContactRepository
	userRepo          repository.UserRepository
}

// NewTicketService creates a new ticket service
func NewTicketService(
	ticketRepo repository.TicketRepository,
	ticketMessageRepo repository.TicketMessageRepository,
	contactRepo repository.ContactRepository,
	userRepo repository.UserRepository,
) TicketService {
	return &ticketService{
		ticketRepo:        ticketRepo,
		ticketMessageRepo: ticketMessageRepo,
		contactRepo:       contactRepo,
		userRepo:          userRepo,
	}
}

// Create creates a new ticket
func (s *ticketService) Create(ctx context.Context, tenantID string, req *dto.CreateTicketRequest) (*dto.TicketResponse, error) {
	// Validate or create contact
	var contactID int64
	if req.RequesterEmail != nil && *req.RequesterEmail != "" {
		contact, err := s.contactRepo.FindByEmail(ctx, tenantID, *req.RequesterEmail)
		if err != nil {
			// Create new contact
			newContact := &helpdesk.Contact{
				TenantID:  tenantID,
				Name:      *req.RequesterName,
				Email:     *req.RequesterEmail,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			if err := s.contactRepo.Create(ctx, newContact); err != nil {
				return nil, errors.Wrap(err, "failed to create contact")
			}
			contactID = newContact.ID
		} else {
			contactID = contact.ID
		}
	}

	// Generate ticket number
	ticketNumber := s.generateTicketNumber(tenantID)

	// Create ticket
	now := time.Now()
	ticket := &helpdesk.Ticket{
		TenantID:       tenantID,
		TicketNumber:   ticketNumber,
		Subject:        req.Subject,
		Description:    req.Description,
		Status:         common.TicketStatusOpen,
		Priority:       req.Priority,
		Source:         req.Source,
		RequesterID:    contactID,
		RequesterName:  req.RequesterName,
		RequesterEmail: req.RequesterEmail,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if req.DueDate != nil {
		ticket.DueDate = req.DueDate
	}

	if err := s.ticketRepo.Create(ctx, ticket); err != nil {
		return nil, errors.Wrap(err, "failed to create ticket")
	}

	// Add initial message if provided
	if req.Description != nil && *req.Description != "" {
		message := &helpdesk.TicketMessage{
			TicketID:    ticket.ID,
			UserID:      nil,
			SenderName:  req.RequesterName,
			SenderEmail: req.RequesterEmail,
			Body:        *req.Description,
			IsInternal:  false,
			CreatedAt:   now,
		}
		if err := s.ticketMessageRepo.Create(ctx, message); err != nil {
			// Log error but don't fail ticket creation
		}
	}

	return s.toTicketResponse(ticket), nil
}

// GetByID gets a ticket by ID
func (s *ticketService) GetByID(ctx context.Context, id int64) (*dto.TicketResponse, error) {
	ticket, err := s.ticketRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("ticket not found")
	}

	return s.toTicketResponse(ticket), nil
}

// GetByTenant gets all tickets for a tenant
func (s *ticketService) GetByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.TicketResponse, int64, error) {
	tickets, total, err := s.ticketRepo.FindByTenant(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get tickets")
	}

	return s.toTicketResponses(tickets), total, nil
}

// GetByStatus gets tickets by status
func (s *ticketService) GetByStatus(ctx context.Context, tenantID string, status common.TicketStatus, page, pageSize int) ([]dto.TicketResponse, int64, error) {
	tickets, total, err := s.ticketRepo.FindByStatus(ctx, tenantID, status, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get tickets by status")
	}

	return s.toTicketResponses(tickets), total, nil
}

// GetByAssignee gets tickets assigned to a user
func (s *ticketService) GetByAssignee(ctx context.Context, assigneeID int64, page, pageSize int) ([]dto.TicketResponse, int64, error) {
	tickets, total, err := s.ticketRepo.FindByAssignee(ctx, assigneeID, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get assignee tickets")
	}

	return s.toTicketResponses(tickets), total, nil
}

// Update updates a ticket
func (s *ticketService) Update(ctx context.Context, id int64, req *dto.UpdateTicketRequest) (*dto.TicketResponse, error) {
	// Get existing ticket
	ticket, err := s.ticketRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("ticket not found")
	}

	// Update fields
	if req.Subject != nil {
		ticket.Subject = *req.Subject
	}
	if req.Description != nil {
		ticket.Description = req.Description
	}
	if req.Priority != nil {
		ticket.Priority = *req.Priority
	}
	if req.DueDate != nil {
		ticket.DueDate = req.DueDate
	}

	ticket.UpdatedAt = time.Now()

	if err := s.ticketRepo.Update(ctx, ticket); err != nil {
		return nil, errors.Wrap(err, "failed to update ticket")
	}

	return s.toTicketResponse(ticket), nil
}

// Delete deletes a ticket
func (s *ticketService) Delete(ctx context.Context, id int64) error {
	// Check if ticket exists
	_, err := s.ticketRepo.FindByID(ctx, id)
	if err != nil {
		return errors.NewNotFound("ticket not found")
	}

	if err := s.ticketRepo.Delete(ctx, id); err != nil {
		return errors.Wrap(err, "failed to delete ticket")
	}

	return nil
}

// Assign assigns a ticket to a user
func (s *ticketService) Assign(ctx context.Context, ticketID, assigneeID int64) error {
	// Get ticket
	ticket, err := s.ticketRepo.FindByID(ctx, ticketID)
	if err != nil {
		return errors.NewNotFound("ticket not found")
	}

	// Validate assignee exists
	_, err = s.userRepo.FindByID(ctx, assigneeID)
	if err != nil {
		return errors.NewNotFound("assignee not found")
	}

	// Assign ticket
	ticket.AssignedToID = &assigneeID
	ticket.UpdatedAt = time.Now()

	if err := s.ticketRepo.Update(ctx, ticket); err != nil {
		return errors.Wrap(err, "failed to assign ticket")
	}

	return nil
}

// UpdateStatus updates ticket status
func (s *ticketService) UpdateStatus(ctx context.Context, ticketID int64, status common.TicketStatus) error {
	// Get ticket
	ticket, err := s.ticketRepo.FindByID(ctx, ticketID)
	if err != nil {
		return errors.NewNotFound("ticket not found")
	}

	// Update status
	ticket.Status = status
	ticket.UpdatedAt = time.Now()

	// Set resolved/closed time
	if status == common.TicketStatusResolved || status == common.TicketStatusClosed {
		now := time.Now()
		if ticket.ResolvedAt == nil {
			ticket.ResolvedAt = &now
		}
	}

	if err := s.ticketRepo.Update(ctx, ticket); err != nil {
		return errors.Wrap(err, "failed to update ticket status")
	}

	return nil
}

// AddMessage adds a message to a ticket
func (s *ticketService) AddMessage(ctx context.Context, ticketID int64, req *dto.AddTicketMessageRequest) (*dto.TicketMessageResponse, error) {
	// Validate ticket exists
	_, err := s.ticketRepo.FindByID(ctx, ticketID)
	if err != nil {
		return nil, errors.NewNotFound("ticket not found")
	}

	// Create message
	now := time.Now()
	message := &helpdesk.TicketMessage{
		TicketID:   ticketID,
		Body:       req.Body,
		IsInternal: req.IsInternal,
		IsHTML:     req.IsHTML,
		CreatedAt:  now,
	}

	if err := s.ticketMessageRepo.Create(ctx, message); err != nil {
		return nil, errors.Wrap(err, "failed to create message")
	}

	return &dto.TicketMessageResponse{
		ID:          message.ID,
		TicketID:    message.TicketID,
		SenderName:  message.SenderName,
		SenderEmail: message.SenderEmail,
		Body:        message.Body,
		IsInternal:  message.IsInternal,
		IsHTML:      message.IsHTML,
		CreatedAt:   message.CreatedAt,
	}, nil
}

// GetMessages gets all messages for a ticket
func (s *ticketService) GetMessages(ctx context.Context, ticketID int64) ([]dto.TicketMessageResponse, error) {
	// Validate ticket exists
	_, err := s.ticketRepo.FindByID(ctx, ticketID)
	if err != nil {
		return nil, errors.NewNotFound("ticket not found")
	}

	messages, err := s.ticketMessageRepo.FindByTicket(ctx, ticketID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get messages")
	}

	responses := make([]dto.TicketMessageResponse, len(messages))
	for i, msg := range messages {
		responses[i] = dto.TicketMessageResponse{
			ID:          msg.ID,
			TicketID:    msg.TicketID,
			SenderName:  msg.SenderName,
			SenderEmail: msg.SenderEmail,
			Body:        msg.Body,
			IsInternal:  msg.IsInternal,
			IsHTML:      msg.IsHTML,
			CreatedAt:   msg.CreatedAt,
		}
	}

	return responses, nil
}

// Search searches for tickets
func (s *ticketService) Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]dto.TicketResponse, int64, error) {
	tickets, total, err := s.ticketRepo.Search(ctx, tenantID, query, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to search tickets")
	}

	return s.toTicketResponses(tickets), total, nil
}

// GetStats gets ticket statistics
func (s *ticketService) GetStats(ctx context.Context, tenantID string, start, end time.Time) (*dto.TicketStatsResponse, error) {
	stats, err := s.ticketRepo.GetStats(ctx, tenantID, start, end)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get ticket stats")
	}

	return &dto.TicketStatsResponse{
		TotalTickets:          int(stats["total_tickets"].(int64)),
		AverageResolutionTime: stats["avg_resolution_time"].(float64),
	}, nil
}

// GetOverdue gets overdue tickets
func (s *ticketService) GetOverdue(ctx context.Context, tenantID string) ([]dto.TicketResponse, error) {
	tickets, err := s.ticketRepo.FindOverdue(ctx, tenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get overdue tickets")
	}

	return s.toTicketResponses(tickets), nil
}

// generateTicketNumber generates a unique ticket number
func (s *ticketService) generateTicketNumber(tenantID string) string {
	return fmt.Sprintf("TKT-%s-%d", tenantID[:8], time.Now().Unix())
}

// toTicketResponse converts Ticket model to response DTO
func (s *ticketService) toTicketResponse(ticket *helpdesk.Ticket) *dto.TicketResponse {
	return &dto.TicketResponse{
		ID:             ticket.ID,
		TenantID:       ticket.TenantID,
		TicketNumber:   ticket.TicketNumber,
		Subject:        ticket.Subject,
		Description:    ticket.Description,
		Status:         ticket.Status,
		Priority:       ticket.Priority,
		Category:       ticket.Category,
		RequesterName:  ticket.RequesterName,
		RequesterEmail: ticket.RequesterEmail,
		AssignedToID:   ticket.AssignedToID,
		AssignedTeam:   ticket.AssignedTeam,
		Source:         ticket.Source,
		DueDate:        ticket.DueDate,
		ResolvedAt:     ticket.ResolvedAt,
		ClosedAt:       ticket.ClosedAt,
		CreatedAt:      ticket.CreatedAt,
		UpdatedAt:      ticket.UpdatedAt,
	}
}

// toTicketResponses converts Ticket models to response DTOs
func (s *ticketService) toTicketResponses(tickets []helpdesk.Ticket) []dto.TicketResponse {
	responses := make([]dto.TicketResponse, len(tickets))
	for i, ticket := range tickets {
		responses[i] = *s.toTicketResponse(&ticket)
	}
	return responses
}
