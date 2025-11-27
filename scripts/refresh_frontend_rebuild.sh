#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

cd "$ROOT_DIR"

echo "[refresh] Cleaning existing frontend build artifacts"
rm -rf "$FRONTEND_DIR/dist"

echo "[refresh] Installing frontend dependencies"
if [[ "${SKIP_NPM_CI:-0}" == "1" ]]; then
  (cd "$FRONTEND_DIR" && npm install)
else
  (cd "$FRONTEND_DIR" && npm ci)
fi

echo "[refresh] Building frontend bundle"
(cd "$FRONTEND_DIR" && npm run build)

echo "[refresh] Rebuilding frontend container image without cache"
docker compose build --no-cache frontend

echo "[refresh] Restarting frontend container"
docker compose up -d frontend

echo "[refresh] Frontend refreshed with clean bundle"
