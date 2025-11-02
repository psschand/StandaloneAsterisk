-- Create test users for demo-tenant
-- All passwords are: Password123!
-- Hash verified with bcrypt.CompareHashAndPassword

-- Insert users
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, status, created_at, updated_at) VALUES
('admin', 'admin@callcenter.com', '$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG', 'Admin', 'User', '+1234567890', 'active', NOW(), NOW()),
('manager', 'manager@callcenter.com', '$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG', 'Manager', 'User', '+1234567891', 'active', NOW(), NOW()),
('agent1', 'agent1@callcenter.com', '$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG', 'Agent', 'One', '+1234567892', 'active', NOW(), NOW()),
('agent2', 'agent2@callcenter.com', '$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG', 'Agent', 'Two', '+1234567893', 'active', NOW(), NOW());

-- Get the user IDs (we'll use last_insert_id approach)
SET @admin_id = (SELECT id FROM users WHERE email = 'admin@callcenter.com');
SET @manager_id = (SELECT id FROM users WHERE email = 'manager@callcenter.com');
SET @agent1_id = (SELECT id FROM users WHERE email = 'agent1@callcenter.com');
SET @agent2_id = (SELECT id FROM users WHERE email = 'agent2@callcenter.com');

-- Assign roles
INSERT INTO user_roles (user_id, tenant_id, role, created_at, updated_at) VALUES
(@admin_id, 'demo-tenant', 'admin', NOW(), NOW()),
(@manager_id, 'demo-tenant', 'manager', NOW(), NOW()),
(@agent1_id, 'demo-tenant', 'agent', NOW(), NOW()),
(@agent2_id, 'demo-tenant', 'agent', NOW(), NOW());

-- Display created users
SELECT 
    u.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    ur.role,
    ur.tenant_id
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.tenant_id = 'demo-tenant'
ORDER BY 
    CASE ur.role 
        WHEN 'admin' THEN 1 
        WHEN 'manager' THEN 2 
        WHEN 'agent' THEN 3 
        ELSE 4 
    END;
