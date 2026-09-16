#!/usr/bin/env bash
# Recover the local Docker stack when web_app cannot resolve web_app_db.
# Run this in a normal terminal (not the agent sandbox) with Docker access.

set -euo pipefail

export DOCKER_HOST="${DOCKER_HOST:-unix:///Users/dariorivera/.lima/docker/sock/docker.sock}"
DOCKER_BIN="${DOCKER_BIN:-/usr/local/bin/docker}"
BASE_URL="${APP_BASE_URL:-http://dev.pockety.com:8080}"

echo "Using DOCKER_HOST=$DOCKER_HOST"
"$DOCKER_BIN" restart web_app_db
"$DOCKER_BIN" restart web_app
sleep 5
"$DOCKER_BIN" ps --filter name=web_app --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo -n "App HTTP status: "
curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/"

echo "Resetting browser test user..."
curl -s -w "\nHTTP_CODE:%{http_code}\n" "$BASE_URL/dev/reset-test-user" | tail -5

echo "Done. Next: node scripts/session-helpers.mjs build"
echo "Then: node scripts/session-helpers.mjs browser page-titles.spec.ts"
