package database

import (
	"fmt"
	"path/filepath"

	"github.com/psschand/callcenter/internal/config"
	"gorm.io/gorm"
)

// Migration represents a database migration
type Migration struct {
	ID   int
	Name string
	SQL  string
}

// RunMigrations executes all pending migrations
func RunMigrations(db *gorm.DB, cfg *config.Config) error {
	// Create migrations table if it doesn't exist
	if err := createMigrationsTable(db); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get applied migrations
	appliedMigrations, err := getAppliedMigrations(db)
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Get all migration files
	migrations, err := getMigrationFiles(cfg)
	if err != nil {
		return fmt.Errorf("failed to get migration files: %w", err)
	}

	// Apply pending migrations
	for _, migration := range migrations {
		if _, applied := appliedMigrations[migration.ID]; applied {
			continue
		}

		fmt.Printf("Running migration %d: %s\n", migration.ID, migration.Name)

		// Execute migration in a transaction
		if err := db.Transaction(func(tx *gorm.DB) error {
			// Execute SQL
			if err := tx.Exec(migration.SQL).Error; err != nil {
				return fmt.Errorf("failed to execute migration: %w", err)
			}

			// Record migration
			if err := tx.Exec("INSERT INTO migrations (id, name) VALUES (?, ?)", migration.ID, migration.Name).Error; err != nil {
				return fmt.Errorf("failed to record migration: %w", err)
			}

			return nil
		}); err != nil {
			return fmt.Errorf("migration %d failed: %w", migration.ID, err)
		}

		fmt.Printf("Migration %d completed successfully\n", migration.ID)
	}

	return nil
}

// createMigrationsTable creates the migrations tracking table
func createMigrationsTable(db *gorm.DB) error {
	sql := `
		CREATE TABLE IF NOT EXISTS migrations (
			id INT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`
	return db.Exec(sql).Error
}

// getAppliedMigrations returns a map of applied migration IDs
func getAppliedMigrations(db *gorm.DB) (map[int]bool, error) {
	var migrations []struct {
		ID int
	}

	if err := db.Raw("SELECT id FROM migrations ORDER BY id").Scan(&migrations).Error; err != nil {
		return nil, err
	}

	applied := make(map[int]bool)
	for _, m := range migrations {
		applied[m.ID] = true
	}

	return applied, nil
}

// getMigrationFiles returns all migration files sorted by ID
func getMigrationFiles(cfg *config.Config) ([]Migration, error) {
	// For now, return empty slice
	// Migration files will be loaded from the migrations directory
	// This is a placeholder that will be implemented with actual file reading

	// TODO: Implement file-based migrations loading
	// migrations := []Migration{}
	// files, err := filepath.Glob("migrations/*.sql")
	// ... parse and sort files

	return []Migration{}, nil
}

// RollbackLastMigration rolls back the most recent migration
func RollbackLastMigration(db *gorm.DB) error {
	var lastMigration struct {
		ID   int
		Name string
	}

	// Get last applied migration
	if err := db.Raw("SELECT id, name FROM migrations ORDER BY id DESC LIMIT 1").Scan(&lastMigration).Error; err != nil {
		return fmt.Errorf("failed to get last migration: %w", err)
	}

	if lastMigration.ID == 0 {
		return fmt.Errorf("no migrations to rollback")
	}

	// Note: Rollback implementation requires down migrations
	// For now, this is a placeholder
	fmt.Printf("Warning: Rollback for migration %d (%s) not implemented\n", lastMigration.ID, lastMigration.Name)
	fmt.Println("Manual rollback may be required")

	return nil
}

// GetMigrationStatus returns the status of all migrations
func GetMigrationStatus(db *gorm.DB) ([]map[string]interface{}, error) {
	var migrations []struct {
		ID        int
		Name      string
		AppliedAt string
	}

	if err := db.Raw("SELECT id, name, applied_at FROM migrations ORDER BY id").Scan(&migrations).Error; err != nil {
		return nil, err
	}

	status := make([]map[string]interface{}, len(migrations))
	for i, m := range migrations {
		status[i] = map[string]interface{}{
			"id":         m.ID,
			"name":       m.Name,
			"applied_at": m.AppliedAt,
			"status":     "applied",
		}
	}

	return status, nil
}

// Helper function to parse migration filename
// Expected format: 001_migration_name.sql
func parseMigrationFilename(filename string) (int, string, error) {
	base := filepath.Base(filename)
	// This is a simplified parser
	// TODO: Implement proper parsing logic
	return 0, base, nil
}
