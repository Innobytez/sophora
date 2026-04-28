# Local Stack

This project now runs locally with:

- the Node app on your Mac
- Postgres in Docker/Colima
- MinIO object storage in Docker/Colima

## First-time status

Current assumptions:

- a Docker-compatible daemon is available on the Mac
- `docker compose` is installed
- local Postgres and MinIO run from `docker-compose.yml`
- `.env` is configured so plain `npm start` uses Postgres + MinIO by default

`npm run up` will auto-start Colima only if `colima` is installed and no Docker daemon is already running. Docker Desktop and OrbStack work too.

## Daily commands

From `sophora-site`:

```bash
npm run up
```

That one command will:

- start Colima if it is installed and no Docker daemon is already running
- start Postgres and MinIO if they are not already running
- wait for both services to be ready
- start the Sophora app

To stop everything:

```bash
npm run down
```

To create a local backup:

```bash
npm run backup
```

To write backups to an external drive instead of the repo folder:

```bash
BACKUP_DIR=/Volumes/YourDrive/SophoraBackups npm run backup
```

If you want the manual version instead:

```bash
npm run services:up
npm start
```

If you use Colima specifically:

```bash
colima start
npm run services:up
npm start
```

## URLs

- app: `http://localhost:3000`
- health check: `http://localhost:3000/api/healthz`
- MinIO API: `http://127.0.0.1:9000`
- MinIO console: `http://127.0.0.1:9001`

## Public deployment target

When you put the site behind Cloudflare Tunnel, use:

- public site URL: `https://sophora.cl`
- local origin for the tunnel: `http://localhost:3000`

## Local service credentials

- Postgres database: `sophora`
- Postgres user: `sophora`
- Postgres password: `sophora`
- MinIO access key: `sophora`
- MinIO secret key: `sophora-storage`
- MinIO bucket: `sophora-local`

## If you need to rerun migration

```bash
DB_CLIENT=postgres DATABASE_URL=postgresql://sophora:sophora@127.0.0.1:5432/sophora npm run migrate:postgres -- --force

STORAGE_DRIVER=s3 \
S3_BUCKET=sophora-local \
S3_REGION=us-east-1 \
S3_ENDPOINT=http://127.0.0.1:9000 \
S3_ACCESS_KEY_ID=sophora \
S3_SECRET_ACCESS_KEY=sophora-storage \
S3_FORCE_PATH_STYLE=true \
npm run migrate:uploads
```
