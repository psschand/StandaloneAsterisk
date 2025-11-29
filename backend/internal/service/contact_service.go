package service

import (
	"context"

	"github.com/psschand/callcenter/internal/helpdesk"
	"github.com/psschand/callcenter/internal/repository"
)

type ContactService interface {
	Create(ctx context.Context, contact *helpdesk.Contact) error
	GetByID(ctx context.Context, id int64) (*helpdesk.Contact, error)
	GetByTenant(ctx context.Context, tenantID string, page, limit int) ([]helpdesk.Contact, int64, error)
	Update(ctx context.Context, contact *helpdesk.Contact) error
	Delete(ctx context.Context, id int64) error
	Search(ctx context.Context, tenantID, query string, page, limit int) ([]helpdesk.Contact, int64, error)
	GetByPhone(ctx context.Context, tenantID, phone string) (*helpdesk.Contact, error)
	GetByEmail(ctx context.Context, tenantID, email string) (*helpdesk.Contact, error)
}

type contactService struct {
	contactRepo repository.ContactRepository
}

func NewContactService(contactRepo repository.ContactRepository) ContactService {
	return &contactService{
		contactRepo: contactRepo,
	}
}

func (s *contactService) Create(ctx context.Context, contact *helpdesk.Contact) error {
	return s.contactRepo.Create(ctx, contact)
}

func (s *contactService) GetByID(ctx context.Context, id int64) (*helpdesk.Contact, error) {
	return s.contactRepo.FindByID(ctx, id)
}

func (s *contactService) GetByTenant(ctx context.Context, tenantID string, page, limit int) ([]helpdesk.Contact, int64, error) {
	offset := (page - 1) * limit
	return s.contactRepo.FindByTenant(ctx, tenantID, limit, offset)
}

func (s *contactService) Update(ctx context.Context, contact *helpdesk.Contact) error {
	return s.contactRepo.Update(ctx, contact)
}

func (s *contactService) Delete(ctx context.Context, id int64) error {
	return s.contactRepo.Delete(ctx, id)
}

func (s *contactService) Search(ctx context.Context, tenantID, query string, page, limit int) ([]helpdesk.Contact, int64, error) {
	offset := (page - 1) * limit
	return s.contactRepo.Search(ctx, tenantID, query, limit, offset)
}

func (s *contactService) GetByPhone(ctx context.Context, tenantID, phone string) (*helpdesk.Contact, error) {
	return s.contactRepo.FindByPhone(ctx, tenantID, phone)
}

func (s *contactService) GetByEmail(ctx context.Context, tenantID, email string) (*helpdesk.Contact, error) {
	return s.contactRepo.FindByEmail(ctx, tenantID, email)
}
