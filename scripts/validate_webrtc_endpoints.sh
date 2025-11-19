#!/bin/bash

# WebRTC Endpoint Configuration Validator
# Checks that all WebRTC endpoints have the required configuration

set -e

MYSQL_HOST="${MYSQL_HOST:-mysql}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASS="${MYSQL_PASS:-callcenterpass}"
MYSQL_DB="${MYSQL_DB:-callcenter}"

echo "========================================"
echo "WebRTC Endpoint Configuration Validator"
echo "========================================"
echo ""

# Check for endpoints with incorrect configuration
echo "Checking WebRTC endpoints for proper configuration..."
echo ""

INVALID_ENDPOINTS=$(docker exec mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" -D"$MYSQL_DB" -sN -e "
SELECT COUNT(*) FROM ps_endpoints 
WHERE webrtc = 'yes' 
  AND (
    direct_media IS NULL OR direct_media != 'no' OR
    force_rport IS NULL OR force_rport != 'yes' OR
    rewrite_contact IS NULL OR rewrite_contact != 'yes' OR
    rtp_symmetric IS NULL OR rtp_symmetric != 'yes' OR
    dtls_verify IS NULL OR dtls_verify != 'no' OR
    dtls_setup IS NULL OR dtls_setup != 'actpass' OR
    ice_support IS NULL OR ice_support != 'yes' OR
    media_encryption IS NULL OR media_encryption != 'dtls' OR
    use_avpf IS NULL OR use_avpf != 'yes' OR
    identify_by IS NULL OR identify_by != 'username'
  );
" 2>/dev/null)

if [ "$INVALID_ENDPOINTS" -gt 0 ]; then
    echo "❌ Found $INVALID_ENDPOINTS WebRTC endpoint(s) with incorrect configuration:"
    echo ""
    
    docker exec mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" -D"$MYSQL_DB" -t -e "
    SELECT 
        id,
        CASE WHEN direct_media = 'no' THEN '✓' ELSE '✗' END as direct_media,
        CASE WHEN force_rport = 'yes' THEN '✓' ELSE '✗' END as force_rport,
        CASE WHEN rewrite_contact = 'yes' THEN '✓' ELSE '✗' END as rewrite_contact,
        CASE WHEN rtp_symmetric = 'yes' THEN '✓' ELSE '✗' END as rtp_symmetric,
        CASE WHEN dtls_verify = 'no' THEN '✓' ELSE '✗' END as dtls_verify,
        CASE WHEN dtls_setup = 'actpass' THEN '✓' ELSE '✗' END as dtls_setup,
        CASE WHEN use_avpf = 'yes' THEN '✓' ELSE '✗' END as use_avpf,
        CASE WHEN identify_by = 'username' THEN '✓' ELSE '✗' END as identify_by
    FROM ps_endpoints 
    WHERE webrtc = 'yes' 
      AND (
        direct_media IS NULL OR direct_media != 'no' OR
        force_rport IS NULL OR force_rport != 'yes' OR
        rewrite_contact IS NULL OR rewrite_contact != 'yes' OR
        rtp_symmetric IS NULL OR rtp_symmetric != 'yes' OR
        dtls_verify IS NULL OR dtls_verify != 'no' OR
        dtls_setup IS NULL OR dtls_setup != 'actpass' OR
        ice_support IS NULL OR ice_support != 'yes' OR
        use_avpf IS NULL OR use_avpf != 'yes' OR
        identify_by IS NULL OR identify_by != 'username'
      );
    " 2>/dev/null
    
    echo ""
    echo "Run the fix script to correct these issues:"
    echo "  ./scripts/fix_webrtc_endpoints.sh"
    echo ""
    exit 1
else
    echo "✅ All WebRTC endpoints are properly configured!"
    echo ""
    
    # Show summary
    TOTAL_WEBRTC=$(docker exec mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" -D"$MYSQL_DB" -sN -e "
    SELECT COUNT(*) FROM ps_endpoints WHERE webrtc = 'yes';
    " 2>/dev/null)
    
    echo "Summary:"
    echo "  Total WebRTC endpoints: $TOTAL_WEBRTC"
    echo ""
    
    docker exec mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" -D"$MYSQL_DB" -t -e "
    SELECT 
        id,
        auth,
        aors,
        transport,
        context
    FROM ps_endpoints 
    WHERE webrtc = 'yes'
    ORDER BY id;
    " 2>/dev/null
    
    echo ""
    exit 0
fi
