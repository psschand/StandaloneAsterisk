package repository

import (
	"context"
	"fmt"

	"github.com/psschand/callcenter/internal/model"
	"gorm.io/gorm"
)

type OutboundRouteRepository interface {
	Create(ctx context.Context, route *model.OutboundRoute) error
	GetByID(ctx context.Context, id int64, tenantID string) (*model.OutboundRoute, error)
	GetAll(ctx context.Context, tenantID string) ([]model.OutboundRoute, error)
	Update(ctx context.Context, route *model.OutboundRoute) error
	Delete(ctx context.Context, id int64, tenantID string) error
	GetByTrunkID(ctx context.Context, trunkID string, tenantID string) ([]model.OutboundRoute, error)
}

type outboundRouteRepository struct {
	db *gorm.DB
}

func NewOutboundRouteRepository(db *gorm.DB) OutboundRouteRepository {
	return &outboundRouteRepository{db: db}
}

func (r *outboundRouteRepository) Create(ctx context.Context, route *model.OutboundRoute) error {
	return r.db.WithContext(ctx).Create(route).Error
}

func (r *outboundRouteRepository) GetByID(ctx context.Context, id int64, tenantID string) (*model.OutboundRoute, error) {
	var route model.OutboundRoute
	err := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&route).Error
	if err != nil {
		return nil, err
	}
	return &route, nil
}

func (r *outboundRouteRepository) GetAll(ctx context.Context, tenantID string) ([]model.OutboundRoute, error) {
	var routes []model.OutboundRoute
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Order("priority ASC, name ASC").
		Find(&routes).Error
	return routes, err
}

func (r *outboundRouteRepository) Update(ctx context.Context, route *model.OutboundRoute) error {
	result := r.db.WithContext(ctx).
		Model(route).
		Where("id = ? AND tenant_id = ?", route.ID, route.TenantID).
		Updates(route)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("outbound route not found")
	}
	return nil
}

func (r *outboundRouteRepository) Delete(ctx context.Context, id int64, tenantID string) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, tenantID).
		Delete(&model.OutboundRoute{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("outbound route not found")
	}
	return nil
}

func (r *outboundRouteRepository) GetByTrunkID(ctx context.Context, trunkID string, tenantID string) ([]model.OutboundRoute, error) {
	var routes []model.OutboundRoute
	err := r.db.WithContext(ctx).
		Where("trunk_id = ? AND tenant_id = ?", trunkID, tenantID).
		Order("priority ASC").
		Find(&routes).Error
	return routes, err
}
