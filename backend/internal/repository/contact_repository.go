package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/helpdesk"
	"gorm.io/gorm"
)

// ContactRepository defines the interface for contact data access
type ContactRepository interface {
	Create(ctx context.Context, contact *helpdesk.Contact) error
	FindByID(ctx context.Context, id int64) (*helpdesk.Contact, error)
	FindByEmail(ctx context.Context, tenantID, email string) (*helpdesk.Contact, error)
	FindByPhone(ctx context.Context, tenantID, phone string) (*helpdesk.Contact, error)
	FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]helpdesk.Contact, int64, error)
	Update(ctx context.Context, contact *helpdesk.Contact) error
	Delete(ctx context.Context, id int64) error
	Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]helpdesk.Contact, int64, error)
	FindWithTickets(ctx context.Context, id int64) (*helpdesk.Contact, error)
}

// contactRepository implements ContactRepository
type contactRepository struct {
	db *gorm.DB
}

// NewContactRepository creates a new contact repository
func NewContactRepository(db *gorm.DB) ContactRepository {
	return &contactRepository{db: db}
}

// Create creates a new contact
func (r *contactRepository) Create(ctx context.Context, contact *helpdesk.Contact) error {
	return r.db.WithContext(ctx).Create(contact).Error
}

// FindByID finds a contact by ID
func (r *contactRepository) FindByID(ctx context.Context, id int64) (*helpdesk.Contact, error) {
	var contact helpdesk.Contact
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&contact).Error
	if err != nil {
		return nil, err
	}
	return &contact, nil
}

// FindByEmail finds a contact by email
func (r *contactRepository) FindByEmail(ctx context.Context, tenantID, email string) (*helpdesk.Contact, error) {
	var contact helpdesk.Contact
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND email = ?", tenantID, email).
		First(&contact).Error
	if err != nil {
		return nil, err
	}
	return &contact, nil
}

// FindByPhone finds a contact by phone
func (r *contactRepository) FindByPhone(ctx context.Context, tenantID, phone string) (*helpdesk.Contact, error) {
	var contact helpdesk.Contact
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND phone = ?", tenantID, phone).
		First(&contact).Error
	if err != nil {
		return nil, err
	}
	return &contact, nil
}

// FindByTenant finds all contacts for a tenant with pagination
func (r *contactRepository) FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]helpdesk.Contact, int64, error) {
	var contacts []helpdesk.Contact
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&helpdesk.Contact{}).Where("tenant_id = ?", tenantID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&contacts).Error

	return contacts, total, err
}

// Update updates a contact
func (r *contactRepository) Update(ctx context.Context, contact *helpdesk.Contact) error {
	return r.db.WithContext(ctx).Save(contact).Error
}

// Delete deletes a contact
func (r *contactRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&helpdesk.Contact{}).Error
}

// Search searches for contacts by name, email, or phone
func (r *contactRepository) Search(ctx context.Context, tenantID, query string, page, pageSize int) ([]helpdesk.Contact, int64, error) {
	var contacts []helpdesk.Contact
	var total int64

	searchPattern := "%" + query + "%"

	// Count total
	if err := r.db.WithContext(ctx).Model(&helpdesk.Contact{}).
		Where("tenant_id = ? AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)",
			tenantID, searchPattern, searchPattern, searchPattern).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)",
			tenantID, searchPattern, searchPattern, searchPattern).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&contacts).Error

	return contacts, total, err
}

// FindWithTickets finds a contact with tickets preloaded
func (r *contactRepository) FindWithTickets(ctx context.Context, id int64) (*helpdesk.Contact, error) {
	var contact helpdesk.Contact
	err := r.db.WithContext(ctx).
		Preload("Tickets", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Where("id = ?", id).
		First(&contact).Error
	if err != nil {
		return nil, err
	}
	return &contact, nil
}
