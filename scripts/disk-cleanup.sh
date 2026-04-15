#!/bin/bash
# Automated disk cleanup — runs weekly via cron
# Logs to /var/log/disk-cleanup.log
LOG=/var/log/disk-cleanup.log
THRESHOLD=70  # Only run cleanup if disk usage exceeds this %

exec >> "$LOG" 2>&1
echo ""
echo "========================================="
echo "Disk cleanup: $(date)"
echo "========================================="

USAGE=$(df / --output=pcent | tail -1 | tr -d ' %')
echo "Disk usage before: ${USAGE}%"

if [ "$USAGE" -lt "$THRESHOLD" ]; then
  echo "Usage ${USAGE}% < ${THRESHOLD}% threshold — skipping cleanup"
  exit 0
fi

echo "--- Docker: removing dangling images ---"
docker image prune -f 2>/dev/null

echo "--- Docker: removing unused volumes ---"
docker volume prune -f 2>/dev/null

echo "--- Docker: removing stopped containers ---"
docker container prune -f 2>/dev/null

echo "--- Docker: removing build cache older than 48h ---"
docker builder prune -f --keep-storage=2GB --filter until=48h 2>/dev/null

echo "--- Journal: vacuum to 200MB ---"
journalctl --vacuum-size=200M 2>/dev/null

echo "--- APT: clean package cache ---"
apt-get clean 2>/dev/null
apt-get autoremove -y 2>/dev/null

echo "--- Truncate btmp (failed login log) > 500MB ---"
BTMP_SIZE=$(du -sm /var/log/btmp 2>/dev/null | cut -f1)
if [ "${BTMP_SIZE:-0}" -gt 500 ]; then
  truncate -s 0 /var/log/btmp
  echo "  btmp truncated (was ${BTMP_SIZE}MB)"
fi

echo "--- Truncate large rotated logs > 100MB ---"
find /var/log -name "*.log.*" -size +100M -delete 2>/dev/null

echo "--- Docker logs per container: cap at 100MB ---"
for f in /var/lib/docker/containers/*/*-json.log; do
  SIZE=$(du -sm "$f" 2>/dev/null | cut -f1)
  if [ "${SIZE:-0}" -gt 100 ]; then
    truncate -s 0 "$f"
    echo "  Truncated container log $f (was ${SIZE}MB)"
  fi
done

USAGE_AFTER=$(df / --output=pcent | tail -1 | tr -d ' %')
echo "Disk usage after:  ${USAGE_AFTER}%"
echo "Freed: $((USAGE - USAGE_AFTER))%"
