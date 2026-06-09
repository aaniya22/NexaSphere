#!/usr/bin/env bash

# NexaSphere CDN Deploy Script
# Syncs built frontend assets to AWS S3 bucket and invalidates CloudFront Distribution.

set -e

# Load environment variables if .env file exists
if [ -f "website/.env" ]; then
  echo "Loading environment variables from website/.env..."
  export $(grep -v '^#' website/.env | xargs)
fi

# Ensure required variables are set
if [ -z "$S3_BUCKET" ]; then
  echo "Error: S3_BUCKET environment variable is not set."
  exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "Error: CLOUDFRONT_DISTRIBUTION_ID environment variable is not set."
  exit 1
fi

if [ -z "$VITE_CDN_URL" ]; then
  echo "Warning: VITE_CDN_URL is not set. Building with relative base paths."
fi

echo "--------------------------------------------------"
echo "Starting NexaSphere Build & CDN Deploy"
echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo "VITE_CDN_URL: ${VITE_CDN_URL:-Not Set}"
echo "--------------------------------------------------"

# Step 1: Install dependencies and Build Frontend
echo "Building client website..."
npm run build --workspace=website

# Step 2: Upload static assets to AWS S3
# Note: Vite builds hashed assets in assets/ folder. These are completely immutable.
echo "Syncing immutable hashed assets to S3 with long-term cache headers..."
aws s3 sync website/dist/assets s3://"$S3_BUCKET"/assets \
  --delete \
  --cache-control "public, max-age=31536000, immutable"

# Sync other root files (index.html, sw.js, manifest, favicon) requiring immediate revalidation
echo "Syncing HTML and entrypoint files to S3 with zero-cache headers..."
aws s3 sync website/dist s3://"$S3_BUCKET" \
  --delete \
  --exclude "assets/*" \
  --cache-control "public, max-age=0, must-revalidate"

# Step 3: Invalidate CloudFront Distribution Cache
echo "Creating CloudFront invalidation..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text)

echo "Invalidation created successfully. ID: $INVALIDATION_ID"
echo "Deploy to CDN completed successfully."
