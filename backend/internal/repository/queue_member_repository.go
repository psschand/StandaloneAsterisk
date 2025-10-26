package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"gorm.io/gorm"
)

// QueueMemberRepository defines the interface for queue member data access
type QueueMemberRepository interface {
	Create(ctx context.Context, member *asterisk.QueueMember) error
	FindByID(ctx context.Context, id int64) (*asterisk.QueueMember, error)
	FindByQueue(ctx context.Context, queueID int64) ([]asterisk.QueueMember, error)
	FindByUser(ctx context.Context, userID int64) ([]asterisk.QueueMember, error)
	Update(ctx context.Context, member *asterisk.QueueMember) error
	Delete(ctx context.Context, id int64) error
	FindActiveByQueue(ctx context.Context, queueID int64) ([]asterisk.QueueMember, error)
	RemoveUserFromQueue(ctx context.Context, queueID, userID int64) error
}

// queueMemberRepository implements QueueMemberRepository
type queueMemberRepository struct {
	db *gorm.DB
}

// NewQueueMemberRepository creates a new queue member repository
func NewQueueMemberRepository(db *gorm.DB) QueueMemberRepository {
	return &queueMemberRepository{db: db}
}

// Create creates a new queue member
func (r *queueMemberRepository) Create(ctx context.Context, member *asterisk.QueueMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

// FindByID finds a queue member by ID
func (r *queueMemberRepository) FindByID(ctx context.Context, id int64) (*asterisk.QueueMember, error) {
	var member asterisk.QueueMember
	err := r.db.WithContext(ctx).
		Preload("Queue").
		Preload("User").
		Where("id = ?", id).
		First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// FindByQueue finds all members of a queue
func (r *queueMemberRepository) FindByQueue(ctx context.Context, queueID int64) ([]asterisk.QueueMember, error) {
	var members []asterisk.QueueMember
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("queue_id = ?", queueID).
		Order("penalty ASC, member_name ASC").
		Find(&members).Error
	return members, err
}

// FindByUser finds all queues a user is a member of
func (r *queueMemberRepository) FindByUser(ctx context.Context, userID int64) ([]asterisk.QueueMember, error) {
	var members []asterisk.QueueMember
	err := r.db.WithContext(ctx).
		Preload("Queue").
		Where("user_id = ?", userID).
		Find(&members).Error
	return members, err
}

// Update updates a queue member
func (r *queueMemberRepository) Update(ctx context.Context, member *asterisk.QueueMember) error {
	return r.db.WithContext(ctx).Save(member).Error
}

// Delete deletes a queue member
func (r *queueMemberRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&asterisk.QueueMember{}).Error
}

// FindActiveByQueue finds all active members of a queue
func (r *queueMemberRepository) FindActiveByQueue(ctx context.Context, queueID int64) ([]asterisk.QueueMember, error) {
	var members []asterisk.QueueMember
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("queue_id = ? AND paused = ?", queueID, false).
		Order("penalty ASC, member_name ASC").
		Find(&members).Error
	return members, err
}

// RemoveUserFromQueue removes a user from a queue
func (r *queueMemberRepository) RemoveUserFromQueue(ctx context.Context, queueID, userID int64) error {
	return r.db.WithContext(ctx).
		Where("queue_id = ? AND user_id = ?", queueID, userID).
		Delete(&asterisk.QueueMember{}).Error
}
