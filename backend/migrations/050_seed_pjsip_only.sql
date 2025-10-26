-- Minimal seed data for ARI testing
-- Only creates PJSIP endpoints for extensions 100 and 101

-- Insert PJSIP endpoints for extensions 100 and 101 (ARA - Asterisk Real-time Architecture)
INSERT INTO ps_endpoints (id, transport, aors, auth, context, disallow, allow, direct_media, ice_support, force_rport, rewrite_contact, rtp_symmetric, dtmf_mode, callerid)
VALUES 
    ('100', 'transport-udp', '100', '100', 'internal', 'all', 'ulaw,alaw,g722', 'no', 'no', 'yes', 'yes', 'yes', 'rfc4733', '"Agent 100" <100>'),
    ('101', 'transport-udp', '101', '101', 'internal', 'all', 'ulaw,alaw,g722', 'no', 'no', 'yes', 'yes', 'yes', 'rfc4733', '"Agent 101" <101>')
ON DUPLICATE KEY UPDATE callerid=VALUES(callerid);

-- Insert PJSIP AORs (Address of Record)
INSERT INTO ps_aors (id, max_contacts, remove_existing, qualify_frequency, authenticate_qualify)
VALUES 
    ('100', 2, 'yes', 60, 'no'),
    ('101', 2, 'yes', 60, 'no')
ON DUPLICATE KEY UPDATE max_contacts=VALUES(max_contacts);

-- Insert PJSIP authentication (matching existing Asterisk config passwords)
INSERT INTO ps_auths (id, auth_type, password, username)
VALUES 
    ('100', 'userpass', 'changeme100', '100'),
    ('101', 'userpass', 'changeme101', '101')
ON DUPLICATE KEY UPDATE password=VALUES(password);
