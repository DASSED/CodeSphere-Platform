#!/usr/bin/env bash
# Usage: ./backup.sh <staging|production>
# Dumps the environment's database to ~/backups, keeps 14 days, then pings the healthchecks.io heartbeat.
# Run by deploy.sh before each deploy and nightly by cron (see README).
set -euo pipefail
cd "$(dirname "$0")"
ENV_NAME="$1"
set -a; . "./.env.${ENV_NAME}"; set +a
PROJECT="codesphere-${ENV_NAME}"

if ! docker ps --format '{{.Names}}' | grep -q "^${PROJECT}-postgres-1$"; then
  echo "No running database for ${ENV_NAME}, nothing to back up"; exit 0
fi
mkdir -p ~/backups
docker exec "${PROJECT}-postgres-1" pg_dump -U postgres codesphere | gzip > ~/backups/${PROJECT}-$(date +%Y%m%d-%H%M%S).sql.gz
find ~/backups -name "${PROJECT}-*.sql.gz" -mtime +14 -delete
if [ -n "${BACKUP_HEARTBEAT_URL:-}" ]; then curl -fsS -m 10 --retry 3 "$BACKUP_HEARTBEAT_URL" > /dev/null; fi
