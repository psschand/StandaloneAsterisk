package repository

import (
	"context"
	"time"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/helpdesk"
	"gorm.io/gorm"
)

// TicketRepository defines the interface for ticket data access
type TicketRepository interface {
	Create(ctx context.Context, ticket *helpdesk.Ticket) error
	FindByID(ctx context.Context, id int64) (*helpdesk.Ticket, error)
	FindByNumber(ctx context.Context, tenantID, ticketNumber string) (*helpdesk.Ticket, error)
	FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]helpdesk.Ticket, int64, error)
	FindByStatus(ctx context.Context, tenantID string, status common.TicketStatus, page, pageSize int) ([]helpdesk.Ticket, int64, error)
	FindByAssignee(ctx context.Context, assigneeID int64, page, pageSize int) ([]helpdesk.Ticket, int64, error)
	FindByRequester(ctx context.Context, requesterID int64, page, pageSize int) ([]helpdesk.Ticket, int64, error)
	Update(ctx context.Context, ticket *helpdesk.Ticket) error
	Delete(ctx context.Context, id int64) error
	FindWithMessages(ctx context.Context, id int64) (*helpdesk.Ticket, error)
	Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]helpdesk.Ticket, int64, error)
	GetStats(ctx context.Context, tenantID string, start, end time.Time) (map[string]interface{}, error)
	FindOverdue(ctx context.Context, tenantID string) ([]helpdesk.Ticket, error)
}

// ticketRepository implements TicketRepository
type ticketRepository struct {
	db *gorm.DB
}

// NewTicketRepository creates a new ticket repository
func NewTicketRepository(db *gorm.DB) TicketRepository {
	return &ticketRepository{db: db}
}

// Create creates a new ticket
func (r *ticketRepository) Create(ctx context.Context, ticket *helpdesk.Ticket) error {
	return r.db.WithContext(ctx).Create(ticket).Error
}

// FindByID finds a ticket by ID
func (r *ticketRepository) FindByID(ctx context.Context, id int64) (*helpdesk.Ticket, error) {
	var ticket helpdesk.Ticket
	err := r.db.WithContext(ctx).
		Preload("Requester").
		Preload("AssignedTo").
		Where("id = ?", id).
		First(&ticket).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

// FindByNumber finds a ticket by ticket number
func (r *ticketRepository) FindByNumber(ctx context.Context, tenantID, ticketNumber string) (*helpdesk.Ticket, error) {
	var ticket helpdesk.Ticket
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND ticket_number = ?", tenantID, ticketNumber).
		First(&ticket).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

// FindByTenant finds all tickets for a tenant with pagination
func (r *ticketRepository) FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]helpdesk.Ticket, int64, error) {
	var tickets []helpdesk.Ticket
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&helpdesk.Ticket{}).Where("tenant_id = ?", tenantID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Preload("Requester").
		Preload("AssignedTo").
		Where("tenant_id = ?", tenantID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&tickets).Error

	return tickets, total, err
}

// FindByStatus finds tickets by status
func (r *ticketRepository) FindByStatus(ctx context.Context, tenantID string, status common.TicketStatus, page, pageSize int) ([]helpdesk.Ticket, int64, error) {
	var tickets []helpdesk.Ticket
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).
		Model(&helpdesk.Ticket{}).
		Where("tenant_id = ? AND status = ?", tenantID, status).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Preload("Requester").
		Preload("AssignedTo").
		Where("tenant_id = ? AND status = ?", tenantID, status).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&tickets).Error

	return tickets, total, err
}

// FindByAssignee finds tickets assigned to a user
func (r *ticketRepository) FindByAssignee(ctx context.Context, assigneeID int64, page, pageSize int) ([]helpdesk.Ticket, int64, error) {
	var tickets []helpdesk.Ticket
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).
		Model(&helpdesk.Ticket{}).
		Where("assigned_to_id = ?", assigneeID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Preload("Requester").
		Preload("AssignedTo").
		Where("assigned_to_id = ?", assigneeID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&tickets).Error

	return tickets, total, err
}

// FindByRequester finds tickets created by a user
func (r *ticketRepository) FindByRequester(ctx context.Context, requesterID int64, page, pageSize int) ([]helpdesk.Ticket, int64, error) {
	var tickets []helpdesk.Ticket
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).
		Model(&helpdesk.Ticket{}).
		Where("requester_id = ?", requesterID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Preload("Requester").
		Preload("AssignedTo").
		Where("requester_id = ?", requesterID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&tickets).Error

	return tickets, total, err
}

// Update updates a ticket
func (r *ticketRepository) Update(ctx context.Context, ticket *helpdesk.Ticket) error {
	return r.db.WithContext(ctx).Save(ticket).Error
}

// Delete soft deletes a ticket
func (r *ticketRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&helpdesk.Ticket{}).Error
}

// FindWithMessages finds a ticket with messages preloaded
func (r *ticketRepository) FindWithMessages(ctx context.Context, id int64) (*helpdesk.Ticket, error) {
	var ticket helpdesk.Ticket
	err := r.db.WithContext(ctx).
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		Preload("Requester").
		Preload("AssignedTo").
		Where("id = ?", id).
		First(&ticket).Error
	if err != nil {
		return nil, err
	}
	return &ticket, nil
}

// Search searches tickets by subject or description
func (r *ticketRepository) Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]helpdesk.Ticket, int64, error) {
	var tickets []helpdesk.Ticket
	var total int64

	searchQuery := "%" + query + "%"
	baseQuery := r.db.WithContext(ctx).
		Model(&helpdesk.Ticket{}).
		Where("tenant_id = ?", tenantID).
		Where("subject LIKE ? OR description LIKE ?", searchQuery, searchQuery)

	// Count total
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := baseQuery.
		Preload("Requester").
		Preload("AssignedTo").
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&tickets).Error

	return tickets, total, err
}

// GetStats returns ticket statistics
func (r *ticketRepository) GetStats(ctx context.Context, tenantID string, start, end time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total tickets
	var totalTickets int64
	if err := r.db.WithContext(ctx).
		Model(&helpdesk.Ticket{}).
		Where("tenant_id = ? AND created_at BETWEEN ? AND ?", tenantID, start, end).
		Count(&totalTickets).Error; err != nil {
		return nil, err
	}
	stats["total_tickets"] = totalTickets

	// Tickets by status
	statusCounts := make(map[string]int64)
	statuses := []common.TicketStatus{
		common.TicketStatusOpen,
		common.TicketStatusInProgress,
		common.TicketStatusPending,
		common.TicketStatusResolved,
		common.TicketStatusClosed,
	}

	for _, status := range statuses {
		var count int64
		if err := r.db.WithContext(ctx).
			Model(&helpdesk.Ticket{}).
			Where("tenant_id = ? AND status = ?", tenantID, status).
			Count(&count).Error; err != nil {
			return nil, err
		}
		statusCounts[string(status)] = count
	}
	stats["by_status"] = statusCounts

	// Average resolution time (for resolved tickets)
	var avgResolutionTime float64
	if err := r.db.WithContext(ctx).
		Model(&helpdesk.Ticket{}).
		Where("tenant_id = ? AND resolved_at IS NOT NULL", tenantID).
		Select("AVG(TIMESTAMPDIFF(SECOND, created_at, resolved_at))").
		Scan(&avgResolutionTime).Error; err != nil {
		return nil, err
	}
	stats["avg_resolution_time_seconds"] = avgResolutionTime

	return stats, nil
}

// FindOverdue finds all overdue tickets
func (r *ticketRepository) FindOverdue(ctx context.Context, tenantID string) ([]helpdesk.Ticket, error) {
	var tickets []helpdesk.Ticket
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND due_date < NOW() AND status NOT IN (?, ?)",
			tenantID, common.TicketStatusResolved, common.TicketStatusClosed).
		Find(&tickets).Error
	return tickets, err
}
