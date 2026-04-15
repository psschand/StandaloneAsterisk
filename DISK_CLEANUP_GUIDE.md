# Disk Space Management Guide

**Date**: April 15, 2026  
**Server**: Oracle Cloud instance, `/dev/sda1` 45G  
**Problem**: Disk hit 80% (36G used) — Docker build cache and dangling images were the primary cause  
**Resolution**: 5GB freed immediately; weekly automated cleanup configured  

---

## Table of Contents

1. [What Was Consuming Space](#1-what-was-consuming-space)
2. [Immediate Cleanup Performed](#2-immediate-cleanup-performed)
3. [Automated Weekly Cleanup](#3-automated-weekly-cleanup)
4. [Permanent Limits Configured](#4-permanent-limits-configured)
5. [Monitoring & Operations](#5-monitoring--operations)
6. [Files Installed on Host](#6-files-installed-on-host)

---

## 1. What Was Consuming Space

Analysis run with `du -sh /* | sort -rh`:

| Location | Size | What it was |
|---|---|---|
| `/var/lib/docker/overlay2` | **15 GB** | Docker layer cache — 49 dangling (unreferenced) images from repeated `docker compose build` runs |
| `/var/lib/docker/volumes` | **20 GB** | Docker volumes (mostly active: asterisk recordings, MySQL data, caddy certs) |
| `/home/ubuntu/go/pkg` | **1.3 GB** | Go module download cache |
| `/var/log/journal` | **265 MB** | systemd journal — no size limit was set |
| `/var/lib/snapd` | **361 MB** | Snap package store |
| `/var/cache/apt` | **127 MB** | Downloaded `.deb` packages |
| `/var/log/btmp` | **62 MB** | Failed SSH login attempts log |

**Key insight**: Docker's `overlay2` directory contains layer data for every image ever built, including intermediate layers from failed or superseded builds. These are invisible to `docker images` (shown as `<none>`) but accumulate silently. After any `docker compose build`, always run `docker image prune -f`.

---

## 2. Immediate Cleanup Performed

```bash
# Remove 49 dangling images (~620MB each from Asterisk builds)
docker image prune -f

# Remove Docker build cache (20GB — all reclaimable)
docker builder prune -af

# Remove unused Docker volumes (8 orphaned volumes)
docker volume prune -f

# Vacuum journal logs to 100MB
sudo journalctl --vacuum-size=100M

# Clear apt downloaded package cache
sudo apt-get clean && sudo apt-get autoremove -y

# Truncate failed-login log (62MB, not needed at that size)
sudo truncate -s 0 /var/log/btmp

# Clear Go module download cache
go clean -modcache
```

**Result**: 80% → 70% (36G → 31G used, 14G free)

> **Safe Docker images still present** (not pruned):
> - `psschand16/asterisk:runtime` (1.69GB) — used as build base
> - `standalone-asterix-asterisk:latest` (620MB) — running container
> - `mysql:8.0` (779MB) — running container
> - `psschand16/postal-arm64:latest` (1.23GB) — postal service

---

## 3. Automated Weekly Cleanup

### Script: `/usr/local/sbin/disk-cleanup.sh`

Runs automatically every **Sunday at 2:00 AM UTC** via systemd timer.  
Only executes cleanup if disk usage exceeds **70%** (configurable via `THRESHOLD`).

```bash
#!/bin/bash
# Automated disk cleanup — runs weekly via systemd timer
# Logs to /var/log/disk-cleanup.log
LOG=/var/log/disk-cleanup.log
THRESHOLD=70  # Only run cleanup if disk usage exceeds this %

exec >> "$LOG" 2>&1

USAGE=$(df / --output=pcent | tail -1 | tr -d ' %')

if [ "$USAGE" -lt "$THRESHOLD" ]; then
  echo "Usage ${USAGE}% < ${THRESHOLD}% threshold — skipping cleanup"
  exit 0
fi

docker image prune -f                              # dangling images
docker volume prune -f                             # unused volumes
docker container prune -f                          # stopped containers
docker builder prune -f --keep-storage=2GB --filter until=48h  # build cache

journalctl --vacuum-size=200M                      # journal logs
apt-get clean && apt-get autoremove -y             # apt cache

# Truncate btmp if > 500MB
BTMP_SIZE=$(du -sm /var/log/btmp 2>/dev/null | cut -f1)
[ "${BTMP_SIZE:-0}" -gt 500 ] && truncate -s 0 /var/log/btmp

# Delete rotated logs > 100MB
find /var/log -name "*.log.*" -size +100M -delete

# Truncate any container log that grew > 100MB
for f in /var/lib/docker/containers/*/*-json.log; do
  SIZE=$(du -sm "$f" 2>/dev/null | cut -f1)
  [ "${SIZE:-0}" -gt 100 ] && truncate -s 0 "$f"
done
```

### systemd Service: `/etc/systemd/system/disk-cleanup.service`

```ini
[Unit]
Description=Weekly disk cleanup (Docker, logs, apt cache)
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/disk-cleanup.sh
StandardOutput=append:/var/log/disk-cleanup.log
StandardError=append:/var/log/disk-cleanup.log
```

### systemd Timer: `/etc/systemd/system/disk-cleanup.timer`

```ini
[Unit]
Description=Run disk cleanup weekly on Sunday at 2am

[Timer]
OnCalendar=Sun *-*-* 02:00:00
Persistent=true      # runs immediately on next boot if it missed the last schedule

[Install]
WantedBy=timers.target
```

---

## 4. Permanent Limits Configured

### Docker Container Log Rotation: `/etc/docker/daemon.json`

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
```

Each container's log is capped at **50MB × 3 rotated files = 150MB max** per container.  
> **Note**: Applies to new containers only. Restart existing containers to apply: `docker compose restart`

### systemd Journal Size Limit: `/etc/systemd/journald.conf.d/size-limit.conf`

```ini
[Journal]
SystemMaxUse=200M      # total journal size cap
SystemKeepFree=500M    # always keep 500MB free on the partition
RuntimeMaxUse=50M      # in-memory journal cap
```

Applied immediately without reboot via `sudo systemctl restart systemd-journald`.

---

## 5. Monitoring & Operations

### Check disk usage

```bash
# Overall disk
df -h /dev/sda1

# Top consumers
du -sh /* 2>/dev/null | sort -rh | head -15

# Docker breakdown
docker system df
sudo du -sh /var/lib/docker/overlay2 /var/lib/docker/volumes
```

### Check the weekly cleanup timer

```bash
# Timer status and next scheduled run
systemctl status disk-cleanup.timer

# List all timers
systemctl list-timers disk-cleanup.timer
```

Expected output when healthy:
```
Active: active (waiting)
Trigger: Sun 2026-04-19 02:00:00 UTC; 3 days left
```

### Check cleanup logs

```bash
# View last cleanup run
tail -50 /var/log/disk-cleanup.log

# Watch live if running manually
tail -f /var/log/disk-cleanup.log

# Check systemd journal for service output
journalctl -u disk-cleanup.service --no-pager
```

### Run cleanup manually

```bash
# Trigger immediately (outside of scheduled time)
sudo /usr/local/sbin/disk-cleanup.sh

# Or via systemd (same result, logs go to /var/log/disk-cleanup.log)
sudo systemctl start disk-cleanup.service

# Check if it ran
journalctl -u disk-cleanup.service -n 30 --no-pager
```

### Modify the cleanup threshold

```bash
sudo nano /usr/local/sbin/disk-cleanup.sh
# Change THRESHOLD=70 to desired percentage

# Reload systemd after any service/timer file changes
sudo systemctl daemon-reload
```

### Full aggressive cleanup (manual, when critically low)

```bash
# WARNING: removes ALL unused images (not just dangling) — re-pull needed after
docker system prune -a -f --volumes

# Or selectively remove specific large dormant images
docker rmi psschand16/asterisk:runtime   # 1.69GB — only if not needed for builds
```

---

## 6. Files Installed on Host

These files are installed directly on the **host OS** (not in Docker) and are not tracked in the Git repository:

| File | Purpose |
|---|---|
| `/usr/local/sbin/disk-cleanup.sh` | Main cleanup script (executable) |
| `/etc/systemd/system/disk-cleanup.service` | systemd service unit |
| `/etc/systemd/system/disk-cleanup.timer` | systemd timer (weekly schedule) |
| `/etc/docker/daemon.json` | Docker log rotation config |
| `/etc/systemd/journald.conf.d/size-limit.conf` | Journal size cap |

### Re-install after a server rebuild

```bash
# 1. Copy disk-cleanup.sh from this repo (or recreate)
sudo cp standalone-asterix/scripts/disk-cleanup.sh /usr/local/sbin/disk-cleanup.sh
sudo chmod +x /usr/local/sbin/disk-cleanup.sh

# 2. Create systemd units (see section 3 above for content)
sudo nano /etc/systemd/system/disk-cleanup.service
sudo nano /etc/systemd/system/disk-cleanup.timer

# 3. Enable timer
sudo systemctl daemon-reload
sudo systemctl enable --now disk-cleanup.timer

# 4. Docker log rotation
echo '{"log-driver":"json-file","log-opts":{"max-size":"50m","max-file":"3"}}' \
  | sudo tee /etc/docker/daemon.json

# 5. Journal size limit
sudo mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=200M\nSystemKeepFree=500M\nRuntimeMaxUse=50M\n' \
  | sudo tee /etc/systemd/journald.conf.d/size-limit.conf
sudo systemctl restart systemd-journald
```
