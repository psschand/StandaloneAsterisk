-- Add permissions JSON column to user_roles table.
-- Use information_schema check for compatibility with MySQL versions
-- that do not support ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
SET @permissions_col_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
	  AND TABLE_NAME = 'user_roles'
	  AND COLUMN_NAME = 'permissions'
);

SET @permissions_col_sql := IF(
	@permissions_col_exists = 0,
	'ALTER TABLE user_roles ADD COLUMN permissions JSON NULL AFTER is_active',
	'SELECT 1'
);

PREPARE permissions_stmt FROM @permissions_col_sql;
EXECUTE permissions_stmt;
DEALLOCATE PREPARE permissions_stmt;
