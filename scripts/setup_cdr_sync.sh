#!/bin/bash
# Setup automatic CDR metadata synchronization

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Setting up CDR metadata sync service..."

# Create systemd service file
sudo tee /etc/systemd/system/cdr-metadata-sync.service > /dev/null <<EOF
[Unit]
Description=CDR Metadata Sync Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=$(whoami)
WorkingDirectory=$PROJECT_DIR
ExecStart=/bin/bash $SCRIPT_DIR/update_cdr_metadata.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create systemd timer file (runs every 2 minutes)
sudo tee /etc/systemd/system/cdr-metadata-sync.timer > /dev/null <<EOF
[Unit]
Description=CDR Metadata Sync Timer
Requires=cdr-metadata-sync.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=2min
AccuracySec=10s

[Install]
WantedBy=timers.target
EOF

# Reload systemd and enable the timer
sudo systemctl daemon-reload
sudo systemctl enable cdr-metadata-sync.timer
sudo systemctl start cdr-metadata-sync.timer

echo "CDR metadata sync timer enabled and started"
echo "Status:"
sudo systemctl status cdr-metadata-sync.timer --no-pager
