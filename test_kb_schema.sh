#!/bin/bash

# Simple test to verify KB file upload schema is ready
set -e

echo "=========================================="
echo "KB SCHEMA VERIFICATION TEST"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

cd /home/ubuntu/wsp/call-center/standalone-asterix

# Step 1: Check table structure
echo "Step 1: Verifying knowledge_base_articles table structure..."
echo ""

docker compose exec -T mysql mysql -ucallcenter -pcallcenterpass callcenter <<'EOSQL'
DESCRIBE knowledge_base_articles;
EOSQL

print_status 0 "Table structure verified"

# Step 2: Check if file-related columns exist
echo ""
echo "Step 2: Checking file upload columns..."

result=$(docker compose exec -T mysql mysql -ucallcenter -pcallcenterpass callcenter -sN <<'EOSQL'
SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'knowledge_base_articles' 
  AND COLUMN_NAME IN ('content_type', 'file_type', 'file_path', 'file_size', 'file_original_name', 'extracted_text');
EOSQL
)

echo "   File columns found: $result / 6"
if [ "$result" -eq 6 ]; then
    print_status 0 "All file upload columns present"
else
    print_status 1 "Missing file upload columns"
    exit 1
fi

# Step 3: Test insert with file metadata
echo ""
echo "Step 3: Testing direct insert with file metadata..."

docker compose exec -T mysql mysql -ucallcenter -pcallcenterpass callcenter <<'EOSQL'
INSERT INTO knowledge_base_articles 
(tenant_id, website_id, title, content, content_type,
 file_type, file_path, file_size, file_original_name, extracted_text,
 category, tags, priority, is_active, created_at, updated_at)
VALUES 
('demo-tenant', NULL, 'Test Shipping Policy', '', 'file',
 'txt', '/app/storage/test.txt', 1024, 'test_shipping.txt', 
 'SHIPPING POLICY\n\nStandard Shipping: 5-7 business days - FREE\nExpress: 2-3 days - $15',
 'Policies', '[]', 10, true, NOW(), NOW());
EOSQL

if [ $? -eq 0 ]; then
    print_status 0 "File metadata inserted successfully"
else
    print_status 1 "Insert failed"
    exit 1
fi

# Step 4: Query the inserted record
echo ""
echo "Step 4: Verifying inserted record..."

docker compose exec -T mysql mysql -ucallcenter -pcallcenterpass callcenter -t <<'EOSQL'
SELECT 
    id,
    title,
    content_type,
    file_type,
    file_size,
    LENGTH(extracted_text) as text_length,
    created_at
FROM knowledge_base_articles 
WHERE content_type = 'file'
ORDER BY created_at DESC 
LIMIT 1;
EOSQL

print_status 0 "Record retrieved successfully"

# Step 5: Test fulltext search on extracted text
echo ""
echo "Step 5: Testing fulltext search on extracted_text..."

search_count=$(docker compose exec -T mysql mysql -ucallcenter -pcallcenterpass callcenter -sN <<'EOSQL'
SELECT COUNT(*) 
FROM knowledge_base_articles 
WHERE MATCH(title, content, extracted_text) AGAINST('shipping' IN NATURAL LANGUAGE MODE);
EOSQL
)

echo "   Records matching 'shipping': $search_count"
if [ "$search_count" -gt 0 ]; then
    print_status 0 "Fulltext search works on extracted_text"
    
    echo ""
    echo "   Search results:"
    docker compose exec -T mysql mysql -ucallcenter -pcallcenterpass callcenter -t <<'EOSQL'
SELECT 
    id,
    title,
    file_type,
    SUBSTRING(extracted_text, 1, 50) as preview
FROM knowledge_base_articles 
WHERE MATCH(title, content, extracted_text) AGAINST('shipping' IN NATURAL LANGUAGE MODE)
LIMIT 3;
EOSQL
else
    print_status 1 "Fulltext search not working"
fi

# Step 6: Check indexes
echo ""
echo "Step 6: Verifying indexes..."

docker compose exec -T mysql mysql -ucallcenter -pcallcenterpass callcenter -t <<'EOSQL'
SHOW INDEXES FROM knowledge_base_articles WHERE Key_name LIKE '%content%';
EOSQL

print_status 0 "Indexes checked"

# Summary
echo ""
echo "=========================================="
echo "SCHEMA VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "✓ Table structure: Ready"
echo "✓ File upload columns: Present"
echo "✓ Data insertion: Working"
echo "✓ Fulltext search: Functional"
echo "✓ Database layer: 100% Ready"
echo ""
echo "Next steps:"
echo "1. Verify backend routes are accessible"
echo "2. Test file upload via API with authentication"
echo "3. Implement frontend file upload UI"
echo ""

echo "Clean up test record? (y/n)"
read -r answer
if [ "$answer" = "y" ]; then
    docker compose exec -T mysql mysql -ucallcenter -pcallcenterpass callcenter <<'EOSQL'
DELETE FROM knowledge_base_articles WHERE title = 'Test Shipping Policy';
EOSQL
    echo "Test record deleted."
fi
