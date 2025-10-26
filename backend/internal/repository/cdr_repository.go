package repository

import (
	"context"
	"time"

	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/common"
	"gorm.io/gorm"
)

// CDRRepository defines the interface for CDR data access
type CDRRepository interface {
	Create(ctx context.Context, cdr *asterisk.CDR) error
	FindByID(ctx context.Context, id int64) (*asterisk.CDR, error)
	FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]asterisk.CDR, int64, error)
	FindByDateRange(ctx context.Context, tenantID string, start, end time.Time, page, pageSize int) ([]asterisk.CDR, int64, error)
	FindByUser(ctx context.Context, userID int64, page, pageSize int) ([]asterisk.CDR, int64, error)
	FindByQueue(ctx context.Context, tenantID, queueName string, page, pageSize int) ([]asterisk.CDR, int64, error)
	GetStats(ctx context.Context, tenantID string, start, end time.Time) (map[string]interface{}, error)
	GetCallVolumeByHour(ctx context.Context, tenantID string, date time.Time) ([]map[string]interface{}, error)
}

// cdrRepository implements CDRRepository
type cdrRepository struct {
	db *gorm.DB
}

// NewCDRRepository creates a new CDR repository
func NewCDRRepository(db *gorm.DB) CDRRepository {
	return &cdrRepository{db: db}
}

// Create creates a new CDR
func (r *cdrRepository) Create(ctx context.Context, cdr *asterisk.CDR) error {
	return r.db.WithContext(ctx).Create(cdr).Error
}

// FindByID finds a CDR by ID
func (r *cdrRepository) FindByID(ctx context.Context, id int64) (*asterisk.CDR, error) {
	var cdr asterisk.CDR
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&cdr).Error
	if err != nil {
		return nil, err
	}
	return &cdr, nil
}

// FindByTenant finds all CDRs for a tenant with pagination
func (r *cdrRepository) FindByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]asterisk.CDR, int64, error) {
	var cdrs []asterisk.CDR
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&asterisk.CDR{}).Where("tenant_id = ?", tenantID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Offset(offset).
		Limit(pageSize).
		Order("calldate DESC").
		Find(&cdrs).Error

	return cdrs, total, err
}

// FindByDateRange finds CDRs within a date range
func (r *cdrRepository) FindByDateRange(ctx context.Context, tenantID string, start, end time.Time, page, pageSize int) ([]asterisk.CDR, int64, error) {
	var cdrs []asterisk.CDR
	var total int64

	query := r.db.WithContext(ctx).
		Model(&asterisk.CDR{}).
		Where("tenant_id = ? AND calldate BETWEEN ? AND ?", tenantID, start, end)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := query.
		Offset(offset).
		Limit(pageSize).
		Order("calldate DESC").
		Find(&cdrs).Error

	return cdrs, total, err
}

// FindByUser finds CDRs for a specific user
func (r *cdrRepository) FindByUser(ctx context.Context, userID int64, page, pageSize int) ([]asterisk.CDR, int64, error) {
	var cdrs []asterisk.CDR
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).Model(&asterisk.CDR{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Offset(offset).
		Limit(pageSize).
		Order("calldate DESC").
		Find(&cdrs).Error

	return cdrs, total, err
}

// FindByQueue finds CDRs for a specific queue
func (r *cdrRepository) FindByQueue(ctx context.Context, tenantID, queueName string, page, pageSize int) ([]asterisk.CDR, int64, error) {
	var cdrs []asterisk.CDR
	var total int64

	// Count total
	if err := r.db.WithContext(ctx).
		Model(&asterisk.CDR{}).
		Where("tenant_id = ? AND queue_name = ?", tenantID, queueName).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND queue_name = ?", tenantID, queueName).
		Offset(offset).
		Limit(pageSize).
		Order("calldate DESC").
		Find(&cdrs).Error

	return cdrs, total, err
}

// GetStats returns call statistics for a tenant
func (r *cdrRepository) GetStats(ctx context.Context, tenantID string, start, end time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total calls
	var totalCalls int64
	if err := r.db.WithContext(ctx).
		Model(&asterisk.CDR{}).
		Where("tenant_id = ? AND calldate BETWEEN ? AND ?", tenantID, start, end).
		Count(&totalCalls).Error; err != nil {
		return nil, err
	}
	stats["total_calls"] = totalCalls

	// Answered calls
	var answeredCalls int64
	if err := r.db.WithContext(ctx).
		Model(&asterisk.CDR{}).
		Where("tenant_id = ? AND calldate BETWEEN ? AND ? AND disposition = ?", tenantID, start, end, common.CallDispositionAnswered).
		Count(&answeredCalls).Error; err != nil {
		return nil, err
	}
	stats["answered_calls"] = answeredCalls

	// Average duration
	var avgDuration float64
	if err := r.db.WithContext(ctx).
		Model(&asterisk.CDR{}).
		Where("tenant_id = ? AND calldate BETWEEN ? AND ? AND disposition = ?", tenantID, start, end, common.CallDispositionAnswered).
		Select("AVG(duration)").
		Scan(&avgDuration).Error; err != nil {
		return nil, err
	}
	stats["avg_duration"] = avgDuration

	// Total talk time
	var totalTalkTime int64
	if err := r.db.WithContext(ctx).
		Model(&asterisk.CDR{}).
		Where("tenant_id = ? AND calldate BETWEEN ? AND ?", tenantID, start, end).
		Select("SUM(billsec)").
		Scan(&totalTalkTime).Error; err != nil {
		return nil, err
	}
	stats["total_talk_time"] = totalTalkTime

	// Answer rate
	if totalCalls > 0 {
		stats["answer_rate"] = float64(answeredCalls) / float64(totalCalls) * 100
	} else {
		stats["answer_rate"] = 0.0
	}

	return stats, nil
}

// GetCallVolumeByHour returns call volume grouped by hour
func (r *cdrRepository) GetCallVolumeByHour(ctx context.Context, tenantID string, date time.Time) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	rows, err := r.db.WithContext(ctx).
		Model(&asterisk.CDR{}).
		Select("HOUR(calldate) as hour, COUNT(*) as count").
		Where("tenant_id = ? AND calldate BETWEEN ? AND ?", tenantID, startOfDay, endOfDay).
		Group("HOUR(calldate)").
		Order("hour").
		Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var hour int
		var count int64
		if err := rows.Scan(&hour, &count); err != nil {
			return nil, err
		}
		results = append(results, map[string]interface{}{
			"hour":  hour,
			"count": count,
		})
	}

	return results, nil
}
