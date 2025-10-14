-- Update user passwords with bcrypt hashes
-- Password: Password123! (bcrypt cost 10)
-- Hash generated using: bcrypt.GenerateFromPassword([]byte("Password123!"), 10)

-- Update passwords for all demo users
-- Bcrypt hash for "Password123!"
UPDATE users SET password_hash = '$2a$10$rjVLXZ4WOFhxRmf4xYfB1OeZ9pW4WvHGzQ4VDcZfGWnJX5T8ZKzVm' 
WHERE email IN (
    'admin@default.com',
    'admin@acme.com',
    'admin@globex.com',
    'supervisor@acme.com',
    'supervisor@globex.com',
    'agent1@acme.com',
    'agent2@acme.com',
    'agent1@globex.com',
    'agent2@globex.com'
);

-- Verify the update
SELECT 
    id,
    email,
    first_name,
    last_name,
    status,
    LEFT(password_hash, 10) as hash_prefix
FROM users
ORDER BY id;
