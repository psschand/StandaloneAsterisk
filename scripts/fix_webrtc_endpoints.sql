-- Fix all existing WebRTC endpoints to have proper configuration
-- This ensures consistent settings across all endpoints

-- Update all WebRTC endpoints with required settings
UPDATE ps_endpoints 
SET 
    direct_media = 'no',           -- Force media through Asterisk for WebRTC
    force_rport = 'yes',           -- Required for NAT traversal
    rewrite_contact = 'yes',       -- Rewrite Contact header for proper routing
    rtp_symmetric = 'yes',         -- Symmetric RTP for NAT traversal
    dtls_verify = 'no',            -- Don't verify DTLS certs (for self-signed)
    dtls_setup = 'actpass',        -- DTLS can be active or passive
    ice_support = 'yes',           -- Enable ICE for WebRTC
    media_encryption = 'dtls',     -- Use DTLS for media encryption
    use_avpf = 'yes',              -- Use AVPF for WebRTC
    identify_by = 'username'       -- Identify endpoints by username
WHERE webrtc = 'yes' 
  AND (
    direct_media IS NULL OR direct_media != 'no' OR
    force_rport IS NULL OR force_rport != 'yes' OR
    rewrite_contact IS NULL OR rewrite_contact != 'yes' OR
    rtp_symmetric IS NULL OR rtp_symmetric != 'yes' OR
    dtls_verify IS NULL OR dtls_verify != 'no' OR
    dtls_setup IS NULL OR dtls_setup != 'actpass' OR
    use_avpf IS NULL OR use_avpf != 'yes' OR
    identify_by IS NULL OR identify_by != 'username'
  );

-- Show results
SELECT 
    id,
    webrtc,
    direct_media,
    force_rport,
    rewrite_contact,
    rtp_symmetric,
    dtls_verify,
    dtls_setup,
    ice_support,
    media_encryption,
    use_avpf,
    identify_by
FROM ps_endpoints 
WHERE webrtc = 'yes'
ORDER BY id;
