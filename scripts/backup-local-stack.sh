#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_ROOT="${BACKUP_DIR:-$ROOT_DIR/backups}"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
DEST_DIR="$BACKUP_ROOT/$TIMESTAMP"

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "[sophora] Missing required command: $command_name" >&2
    exit 1
  fi
}

require_container() {
  local container_name="$1"
  if ! docker inspect "$container_name" >/dev/null 2>&1; then
    echo "[sophora] Required container not found: $container_name" >&2
    exit 1
  fi
  local running
  running="$(docker inspect -f '{{.State.Running}}' "$container_name" 2>/dev/null || true)"
  if [ "$running" != "true" ]; then
    echo "[sophora] Required container is not running: $container_name" >&2
    exit 1
  fi
}

require_command docker
mkdir -p "$DEST_DIR"

require_container sophora-postgres
require_container sophora-minio

echo "[sophora] Backing up Postgres to $DEST_DIR/postgres.sql"
docker exec sophora-postgres pg_dump -U sophora -d sophora --clean --if-exists > "$DEST_DIR/postgres.sql"
docker exec sophora-postgres pg_dumpall -U sophora --globals-only > "$DEST_DIR/postgres-globals.sql"

echo "[sophora] Backing up MinIO data to $DEST_DIR/minio-data.tgz"
rm -rf "$DEST_DIR/minio-data"
mkdir -p "$DEST_DIR/minio-data"
docker cp sophora-minio:/data/. "$DEST_DIR/minio-data"
tar czf "$DEST_DIR/minio-data.tgz" -C "$DEST_DIR/minio-data" .
rm -rf "$DEST_DIR/minio-data"

echo "[sophora] Backing up local config"
cp docker-compose.yml "$DEST_DIR/docker-compose.yml"
cp LOCAL_STACK.md "$DEST_DIR/LOCAL_STACK.md"
if [ -f .env ]; then
  cp .env "$DEST_DIR/.env"
  chmod 600 "$DEST_DIR/.env"
fi

cat > "$DEST_DIR/README.txt" <<EOF
Sophora local stack backup

Created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Source host: $(hostname)
App URL: ${APP_URL:-https://sophora.cl}

Files:
- postgres.sql
- postgres-globals.sql
- minio-data.tgz
- docker-compose.yml
- LOCAL_STACK.md
- .env (if present)

To store backups on an external drive:
BACKUP_DIR=/Volumes/YourDrive/SophoraBackups npm run backup
EOF

echo "[sophora] Backup complete: $DEST_DIR"
