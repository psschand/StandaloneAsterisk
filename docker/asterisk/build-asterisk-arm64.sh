#!/usr/bin/env bash
# Build script to create an ARM64 Asterisk image using docker buildx
# Usage:
#   ./build-asterisk-arm64.sh [tag]
# Example:
#   ./build-asterisk-arm64.sh call-center-asterisk:arm64

set -euo pipefail
TAG=${1:-call-center-asterisk:arm64}
DOCKERFILE="$(dirname "$0")/Dockerfile.arm64"

echo "Building Asterisk image for linux/arm64 with tag=${TAG}"
# Ensure builder exists
docker buildx inspect multi-arch-builder >/dev/null 2>&1 || docker buildx create --use --name multi-arch-builder

# Build for linux/arm64 only (you can add linux/amd64,linux/arm64 for multi-arch)
docker buildx build --platform linux/arm64 -f "$DOCKERFILE" -t "$TAG" --progress=plain --load $(dirname "$0")

echo "Built image: $TAG"
