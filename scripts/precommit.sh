#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CYPRESS_IMAGE="${CYPRESS_IMAGE:-cypress/included:15.15.0}"
SERVER_LOG="${TMPDIR:-/tmp}/react-frontend-app-vite-precommit.log"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}

wait_for_server() {
  for _ in {1..60}; do
    if curl -fsS "http://localhost:5173" >/dev/null 2>&1; then
      return 0
    fi

    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      echo "Vite dev server exited before it was ready."
      tail -n 80 "$SERVER_LOG" || true
      return 1
    fi

    sleep 1
  done

  echo "Timed out waiting for Vite at http://localhost:5173."
  tail -n 80 "$SERVER_LOG" || true
  return 1
}

cd "$ROOT_DIR"
trap cleanup EXIT

bun run lint
bun run build

docker run --rm \
  -e VITE_CACHE_DIR=/tmp/react-frontend-app-vite-cache \
  -v "$ROOT_DIR:/e2e" \
  -w /e2e \
  "$CYPRESS_IMAGE" \
  --component \
  --config video=false

bun run dev -- --host 0.0.0.0 >"$SERVER_LOG" 2>&1 &
SERVER_PID="$!"
wait_for_server

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$ROOT_DIR:/e2e" \
  -w /e2e \
  "$CYPRESS_IMAGE" \
  --e2e \
  --config baseUrl=http://host.docker.internal:5173,video=false
