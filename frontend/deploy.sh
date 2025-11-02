#!/bin/bash
# Deploy frontend to S3 + CloudFront

set -e

echo "🚀 Deploying Call Center Frontend to S3..."

# Configuration
S3_BUCKET="${S3_BUCKET:-your-bucket-name}"
CLOUDFRONT_ID="${CLOUDFRONT_ID:-YOUR_DISTRIBUTION_ID}"
AWS_PROFILE="${AWS_PROFILE:-default}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Building production bundle...${NC}"
npm run build

if [ ! -d "dist" ]; then
  echo -e "${RED}Error: dist/ directory not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Build complete${NC}"

echo -e "${BLUE}Step 2: Uploading to S3...${NC}"
aws s3 sync dist/ s3://${S3_BUCKET}/ \
  --profile ${AWS_PROFILE} \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.html"

# Upload HTML files with no-cache
aws s3 sync dist/ s3://${S3_BUCKET}/ \
  --profile ${AWS_PROFILE} \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "*.html"

echo -e "${GREEN}✓ Upload complete${NC}"

if [ "$CLOUDFRONT_ID" != "YOUR_DISTRIBUTION_ID" ]; then
  echo -e "${BLUE}Step 3: Invalidating CloudFront cache...${NC}"
  aws cloudfront create-invalidation \
    --profile ${AWS_PROFILE} \
    --distribution-id ${CLOUDFRONT_ID} \
    --paths "/*"
  echo -e "${GREEN}✓ Cache invalidated${NC}"
else
  echo -e "${BLUE}Skipping CloudFront invalidation (no distribution ID set)${NC}"
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Frontend URL: https://${S3_BUCKET}.s3.amazonaws.com/index.html"
echo "or your CloudFront URL if configured"
