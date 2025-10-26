package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"gorm.io/gorm"
)

// QueueRepository defines the interface for queue data access
type QueueRepository interface {
	Create(ctx context.Context, queue *asterisk.Queue) error
	FindByID(ctx context.Context, id int64) (*asterisk.Queue, error)
	FindByName(ctx context.Context, tenantID, name string) (*asterisk.Queue, error)
	FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]asterisk.Queue, int64, error)
	Update(ctx context.Context, queue *asterisk.Queue) error
	Delete(ctx context.Context, id int64) error
	FindWithMembers(ctx context.Context, id int64) (*asterisk.Queue, error)
	FindActive(ctx context.Context, tenantID string) ([]asterisk.Queue, error)
}

// queueRepository implements QueueRepository
type queueRepository struct {
	db *gorm.DB
}

// NewQueueRepository creates a new queue repository
func NewQueueRepository(db *gorm.DB) QueueRepository {
	return &queueRepository{db: db}
}

// Create creates a new queue
func (r *queueRepository) Create(ctx context.Context, queue *asterisk.Queue) error {
	return r.db.WithContext(ctx).Create(queue).Error
}

// FindByID finds a queue by ID
func (r *queueRepository) FindByID(ctx context.Context, id int64) (*asterisk.Queue, error) {
	var queue asterisk.Queue
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&queue).Error
	if err != nil {
		return nil, err
	}
	return &queue, nil
}

// FindByName finds a queue by tenant and name
func (r *queueRepository) FindByName(ctx context.Context, tenantID, name string) (*asterisk.Queue, error) {
	var queue asterisk.Queue
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND name = ?", tenantID, name).
		First(&queue).Error
	if err != nil {
		return nil, err
	}
	return &queue, nil
}

// FindByTenant finds all queues for a tenant with pagination
func (r *queueRepository) FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]asterisk.Queue, int64, error) {
	var queues []asterisk.Queue
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&asterisk.Queue{}).Where("tenant_id = ?", tenantID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&queues).Error

	return queues, total, err
}

// Update updates a queue
func (r *queueRepository) Update(ctx context.Context, queue *asterisk.Queue) error {
	return r.db.WithContext(ctx).Save(queue).Error
}

// Delete deletes a queue
func (r *queueRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&asterisk.Queue{}).Error
}

// FindWithMembers finds a queue with members preloaded
func (r *queueRepository) FindWithMembers(ctx context.Context, id int64) (*asterisk.Queue, error) {
	var queue asterisk.Queue
	err := r.db.WithContext(ctx).
		Preload("Members").
		Where("id = ?", id).
		First(&queue).Error
	if err != nil {
		return nil, err
	}
	return &queue, nil
}

// FindActive finds all active queues for a tenant
func (r *queueRepository) FindActive(ctx context.Context, tenantID string) ([]asterisk.Queue, error) {
	var queues []asterisk.Queue
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND status = ?", tenantID, "active").
		Find(&queues).Error
	return queues, err
}
