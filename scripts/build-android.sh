#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo "========================================"
echo "  BUILD ANDROID — Docker local"
echo "========================================"
echo ""

if ! docker info > /dev/null 2>&1; then
  echo "Docker n'est pas demarre. Lancez Docker Desktop puis reessayez."
  exit 1
fi
echo "Docker est actif"

ENV_FILE=".env.mobile"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ENV_FILE"
  set +a
  echo "Variables .env.mobile chargees"
fi

mkdir -p generated/builds/apk generated/source/android

echo ""
echo "Lancement du build Docker..."
echo ""

if [ -f "$ENV_FILE" ]; then
  docker compose --env-file .env.mobile -f docker/docker-compose.yml up \
    --build \
    --abort-on-container-exit \
    --exit-code-from android-builder \
    --remove-orphans
else
  docker compose -f docker/docker-compose.yml up \
    --build \
    --abort-on-container-exit \
    --exit-code-from android-builder \
    --remove-orphans
fi

echo ""
echo "Build termine ! APK : generated/builds/apk/app-debug.apk"
