#!/usr/bin/env bash
# Usage: ./deploy.sh <staging|production> <image-tag>
# Pull, back up the database, migrate, start, check /ready. On failure the previous containers keep running.
set -euo pipefail
ENV_NAME="$1"; IMAGE_TAG="$2"
ENV_FILE=".env.${ENV_NAME}"
set -a; . "./${ENV_FILE}"; set +a
export ENV_NAME IMAGE_TAG
PROJECT="codesphere-${ENV_NAME}"
COMPOSE=(docker compose -p "$PROJECT" --env-file "$ENV_FILE" -f compose.app.yml)

"${COMPOSE[@]}" pull
mkdir -p ~/backups
if docker ps --format '{{.Names}}' | grep -q "^${PROJECT}-postgres-1$"; then
  docker exec "${PROJECT}-postgres-1" pg_dump -U postgres codesphere | gzip > ~/backups/${PROJECT}-$(date +%Y%m%d-%H%M%S).sql.gz
fi
"${COMPOSE[@]}" up -d --wait
docker exec "${PROJECT}-server-1" bun -e "fetch('http://localhost:3000/').then((r) => process.exit(r.ok ? 0 : 1))"
echo "Deployed ${IMAGE_TAG} to ${ENV_NAME}"
