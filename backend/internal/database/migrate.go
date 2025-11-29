package database

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

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

		// Execute migration - split by semicolons for multiple statements
		statements := splitSQLStatements(migration.SQL)

		// Execute in a transaction
		if err := db.Transaction(func(tx *gorm.DB) error {
			// Execute each statement separately
			for i, stmt := range statements {
				stmt = strings.TrimSpace(stmt)
				if stmt == "" {
					continue
				}

				if err := tx.Exec(stmt).Error; err != nil {
					return fmt.Errorf("failed to execute statement %d: %w\nSQL: %s", i+1, err, stmt[:min(len(stmt), 200)])
				}
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
	// Get migrations directory path - use hardcoded path for now
	migrationsDir := "./migrations"

	// Read all SQL files from migrations directory
	pattern := filepath.Join(migrationsDir, "*.sql")
	files, err := filepath.Glob(pattern)
	if err != nil {
		return nil, fmt.Errorf("failed to read migration files: %w", err)
	}

	if len(files) == 0 {
		return []Migration{}, nil
	}

	migrations := make([]Migration, 0, len(files))
	for _, file := range files {
		id, name, err := parseMigrationFilename(file)
		if err != nil {
			fmt.Printf("Warning: Skipping invalid migration file %s: %v\n", file, err)
			continue
		}

		// Read SQL content
		content, err := os.ReadFile(file)
		if err != nil {
			return nil, fmt.Errorf("failed to read migration file %s: %w", file, err)
		}

		migrations = append(migrations, Migration{
			ID:   id,
			Name: name,
			SQL:  string(content),
		})
	}

	// Sort migrations by ID
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].ID < migrations[j].ID
	})

	return migrations, nil
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
// Expected format: 001_migration_name.sql or 001-migration-name.sql
func parseMigrationFilename(filename string) (int, string, error) {
	base := filepath.Base(filename)

	// Remove .sql extension
	name := base
	if len(name) > 4 && name[len(name)-4:] == ".sql" {
		name = name[:len(name)-4]
	}

	// Find first separator (_ or -)
	var separator string

	if underscoreIdx := strings.Index(name, "_"); underscoreIdx > 0 {
		separator = "_"
	} else if dashIdx := strings.Index(name, "-"); dashIdx > 0 {
		separator = "-"
	} else {
		return 0, "", fmt.Errorf("invalid migration filename format (expected: NNN_name.sql or NNN-name.sql)")
	}

	parts := strings.SplitN(name, separator, 2)
	if len(parts) != 2 {
		return 0, "", fmt.Errorf("invalid migration filename format")
	}

	// Parse ID
	parsedID, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, "", fmt.Errorf("invalid migration ID: %w", err)
	}

	migrationName := parts[1]
	if migrationName == "" {
		return 0, "", fmt.Errorf("migration name cannot be empty")
	}

	return parsedID, migrationName, nil
}

// splitSQLStatements splits a SQL string into individual statements
// Handles semicolons within quotes and comments
func splitSQLStatements(sql string) []string {
	var statements []string
	var current strings.Builder
	inSingleQuote := false
	inDoubleQuote := false
	inComment := false

	lines := strings.Split(sql, "\n")

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Skip empty lines and comment-only lines
		if trimmed == "" || strings.HasPrefix(trimmed, "--") {
			continue
		}

		// Track quote state for the line
		for i := 0; i < len(line); i++ {
			ch := line[i]

			// Handle comments
			if i < len(line)-1 && line[i:i+2] == "--" && !inSingleQuote && !inDoubleQuote {
				inComment = true
			}

			// Handle quotes
			if ch == '\'' && !inDoubleQuote && !inComment {
				inSingleQuote = !inSingleQuote
			}
			if ch == '"' && !inSingleQuote && !inComment {
				inDoubleQuote = !inDoubleQuote
			}

			// Handle statement separators
			if ch == ';' && !inSingleQuote && !inDoubleQuote && !inComment {
				// End of statement
				stmt := strings.TrimSpace(current.String())
				if stmt != "" {
					statements = append(statements, stmt)
				}
				current.Reset()
				continue
			}

			if !inComment {
				current.WriteByte(ch)
			}
		}

		// Reset comment flag at end of line
		inComment = false
		current.WriteString("\n")
	}

	// Add final statement if exists
	final := strings.TrimSpace(current.String())
	if final != "" {
		statements = append(statements, final)
	}

	return statements
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
