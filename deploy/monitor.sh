#!/usr/bin/env bash
# Run every 15 minutes by cron. Alerts the team Telegram group when disk or memory crosses its threshold.
# Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in ~/codesphere/deploy/.env.monitor (chmod 600).
set -euo pipefail
cd "$(dirname "$0")"
set -a; . ./.env.monitor; set +a
DISK_MAX="${DISK_MAX:-80}"; MEM_MAX="${MEM_MAX:-90}"

alert() {
  curl -fsS -m 10 "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode chat_id="$TELEGRAM_CHAT_ID" --data-urlencode text="⚠️ $(hostname): $1" > /dev/null
}

disk=$(df --output=pcent / | tail -1 | tr -dc '0-9')
mem=$(free | awk '/^Mem:/ { printf "%d", ($2 - $7) * 100 / $2 }')
[ "$disk" -ge "$DISK_MAX" ] && alert "disque à ${disk} % (seuil ${DISK_MAX} %)"
[ "$mem" -ge "$MEM_MAX" ] && alert "mémoire à ${mem} % (seuil ${MEM_MAX} %)"
exit 0
