package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/helpdesk"
	"gorm.io/gorm"
)

// TicketMessageRepository defines the interface for ticket message data access
type TicketMessageRepository interface {
	Create(ctx context.Context, message *helpdesk.TicketMessage) error
	FindByID(ctx context.Context, id int64) (*helpdesk.TicketMessage, error)
	FindByTicket(ctx context.Context, ticketID int64) ([]helpdesk.TicketMessage, error)
	Update(ctx context.Context, message *helpdesk.TicketMessage) error
	Delete(ctx context.Context, id int64) error
	FindPublicMessages(ctx context.Context, ticketID int64) ([]helpdesk.TicketMessage, error)
}

// ticketMessageRepository implements TicketMessageRepository
type ticketMessageRepository struct {
	db *gorm.DB
}

// NewTicketMessageRepository creates a new ticket message repository
func NewTicketMessageRepository(db *gorm.DB) TicketMessageRepository {
	return &ticketMessageRepository{db: db}
}

// Create creates a new ticket message
func (r *ticketMessageRepository) Create(ctx context.Context, message *helpdesk.TicketMessage) error {
	return r.db.WithContext(ctx).Create(message).Error
}

// FindByID finds a ticket message by ID
func (r *ticketMessageRepository) FindByID(ctx context.Context, id int64) (*helpdesk.TicketMessage, error) {
	var message helpdesk.TicketMessage
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("id = ?", id).
		First(&message).Error
	if err != nil {
		return nil, err
	}
	return &message, nil
}

// FindByTicket finds all messages for a ticket
func (r *ticketMessageRepository) FindByTicket(ctx context.Context, ticketID int64) ([]helpdesk.TicketMessage, error) {
	var messages []helpdesk.TicketMessage
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("ticket_id = ?", ticketID).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

// Update updates a ticket message
func (r *ticketMessageRepository) Update(ctx context.Context, message *helpdesk.TicketMessage) error {
	return r.db.WithContext(ctx).Save(message).Error
}

// Delete deletes a ticket message
func (r *ticketMessageRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&helpdesk.TicketMessage{}).Error
}

// FindPublicMessages finds all public (non-internal) messages for a ticket
func (r *ticketMessageRepository) FindPublicMessages(ctx context.Context, ticketID int64) ([]helpdesk.TicketMessage, error) {
	var messages []helpdesk.TicketMessage
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("ticket_id = ? AND is_internal = ?", ticketID, false).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}
