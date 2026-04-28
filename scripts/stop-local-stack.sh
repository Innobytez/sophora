#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

is_colima_running() {
  local status_output
  status_output="$(colima ls -j 2>/dev/null || true)"
  printf '%s' "$status_output" | grep -q '"status":"Running"'
}

docker_ready() {
  docker info >/dev/null 2>&1
}

if command -v docker >/dev/null 2>&1 && docker_ready; then
  docker compose down
fi

if command -v colima >/dev/null 2>&1 && is_colima_running; then
  colima stop
fi
