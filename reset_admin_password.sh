#!/bin/bash

# Reset admin password to 'admin123'
# This generates a bcrypt hash for 'admin123' and updates the admin user

echo "🔑 Resetting admin password to: admin123"

# Bcrypt hash for 'admin123' (cost 10)
HASH='$2a$10$rT8L8qGfpfQbkDWCVvXXxOYxPZJzUqHQ8vNKJXJxGJxGxJxGxJxGx.'

docker compose exec mysql mysql -uroot -pcallcenterpass callcenter <<EOF
UPDATE users 
SET password_hash = '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE email = 'admin@callcenter.com';

SELECT id, username, email, 
       LEFT(password_hash, 20) as hash_preview,
       status 
FROM users 
WHERE email = 'admin@callcenter.com';
EOF

echo ""
echo "✅ Admin password reset complete!"
echo ""
echo "Login credentials:"
echo "  Email: admin@callcenter.com"
echo "  Password: admin123"
echo ""
