package repository

import (
	"context"

	"github.com/psschand/callcenter/internal/asterisk"
	"gorm.io/gorm"
)

// IVRMenuRepository defines operations on IVR menus and options.
type IVRMenuRepository interface {
	Create(ctx context.Context, menu *asterisk.IVRMenu) error
	Update(ctx context.Context, menu *asterisk.IVRMenu) error
	Delete(ctx context.Context, tenantID string, id int64) error
	FindByID(ctx context.Context, tenantID string, id int64) (*asterisk.IVRMenu, error)
	FindByTenant(ctx context.Context, tenantID string) ([]asterisk.IVRMenu, error)
	FindByName(ctx context.Context, tenantID, name string) (*asterisk.IVRMenu, error)
}

// ivrMenuRepository implements IVRMenuRepository.
type ivrMenuRepository struct {
	db *gorm.DB
}

// NewIVRMenuRepository creates a new IVR repository.
func NewIVRMenuRepository(db *gorm.DB) IVRMenuRepository {
	return &ivrMenuRepository{db: db}
}

func (r *ivrMenuRepository) ensureSchema(ctx context.Context) error {
	migrator := r.db.WithContext(ctx).Migrator()

	if !migrator.HasColumn(&asterisk.IVRMenu{}, "DisplayName") {
		if err := migrator.AddColumn(&asterisk.IVRMenu{}, "DisplayName"); err != nil {
			return err
		}
	}

	if !migrator.HasColumn(&asterisk.IVRMenu{}, "Status") {
		if err := migrator.AddColumn(&asterisk.IVRMenu{}, "Status"); err != nil {
			return err
		}
	}

	if !migrator.HasColumn(&asterisk.IVRMenu{}, "InvalidOptionAction") {
		if err := migrator.AddColumn(&asterisk.IVRMenu{}, "InvalidOptionAction"); err != nil {
			return err
		}
	}

	if !migrator.HasColumn(&asterisk.IVRMenu{}, "TimeoutAction") {
		if err := migrator.AddColumn(&asterisk.IVRMenu{}, "TimeoutAction"); err != nil {
			return err
		}
	}

	return nil
}

// Create inserts an IVR menu with its options.
func (r *ivrMenuRepository) Create(ctx context.Context, menu *asterisk.IVRMenu) error {
	if err := r.ensureSchema(ctx); err != nil {
		return err
	}
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(menu).Error; err != nil {
			return err
		}

		if len(menu.Options) > 0 {
			for i := range menu.Options {
				menu.Options[i].IVRMenuID = menu.ID
				menu.Options[i].ID = 0 // Clear ID to let DB auto-increment
			}
			if err := tx.Create(&menu.Options).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// Update replaces IVR menu metadata and options.
func (r *ivrMenuRepository) Update(ctx context.Context, menu *asterisk.IVRMenu) error {
	if err := r.ensureSchema(ctx); err != nil {
		return err
	}
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&asterisk.IVRMenu{}).
			Where("id = ? AND tenant_id = ?", menu.ID, menu.TenantID).
			Updates(map[string]interface{}{
				"display_name":          menu.DisplayName,
				"description":           menu.Description,
				"greeting_text":         menu.GreetingText,
				"greeting_audio_url":    menu.GreetingAudioURL,
				"timeout":               menu.Timeout,
				"max_attempts":          menu.MaxAttempts,
				"status":                menu.Status,
				"invalid_option_action": menu.InvalidOptionAction,
				"timeout_action":        menu.TimeoutAction,
				"is_active":             menu.IsActive,
				"updated_at":            menu.UpdatedAt,
			}).Error; err != nil {
			return err
		}

		// Replace options wholesale for now.
		if err := tx.Where("ivr_menu_id = ?", menu.ID).Delete(&asterisk.IVROption{}).Error; err != nil {
			return err
		}

		if len(menu.Options) > 0 {
			for i := range menu.Options {
				menu.Options[i].IVRMenuID = menu.ID
				menu.Options[i].ID = 0 // Clear ID to let DB auto-increment
			}
			if err := tx.Create(&menu.Options).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// Delete removes an IVR menu (options cascade via FK).
func (r *ivrMenuRepository) Delete(ctx context.Context, tenantID string, id int64) error {
	return r.db.WithContext(ctx).
		Where("tenant_id = ? AND id = ?", tenantID, id).
		Delete(&asterisk.IVRMenu{}).
		Error
}

// FindByID fetches an IVR menu with options for a tenant.
func (r *ivrMenuRepository) FindByID(ctx context.Context, tenantID string, id int64) (*asterisk.IVRMenu, error) {
	var menu asterisk.IVRMenu
	err := r.db.WithContext(ctx).
		Preload("Options", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC, digit ASC")
		}).
		Where("tenant_id = ? AND id = ?", tenantID, id).
		First(&menu).Error
	if err != nil {
		return nil, err
	}
	return &menu, nil
}

// FindByTenant returns all IVR menus for a tenant.
func (r *ivrMenuRepository) FindByTenant(ctx context.Context, tenantID string) ([]asterisk.IVRMenu, error) {
	var menus []asterisk.IVRMenu
	err := r.db.WithContext(ctx).
		Preload("Options", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC, digit ASC")
		}).
		Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&menus).Error
	return menus, err
}

// FindByName fetches an IVR menu by name for uniqueness checks.
func (r *ivrMenuRepository) FindByName(ctx context.Context, tenantID, name string) (*asterisk.IVRMenu, error) {
	var menu asterisk.IVRMenu
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND name = ?", tenantID, name).
		First(&menu).Error
	if err != nil {
		return nil, err
	}
	return &menu, nil
}
