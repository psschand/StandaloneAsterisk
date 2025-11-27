# CDR Metadata Auto-Update Setup

This directory contains scripts and services to automatically update CDR metadata (recording URLs, call direction, caller/destination info) from Asterisk's raw CDR fields.

## Files

- **update_cdr_metadata.sh** - Main script that updates CDR fields
- **cdr-metadata-updater.service** - Systemd service definition
- **cdr-metadata-updater.timer** - Systemd timer (runs every minute)

## Manual Setup (Optional)

If you want automatic updates every minute:

```bash
# Copy service and timer files
sudo cp scripts/cdr-metadata-updater.service /etc/systemd/system/
sudo cp scripts/cdr-metadata-updater.timer /etc/systemd/system/

# Reload systemd and enable timer
sudo systemctl daemon-reload
sudo systemctl enable cdr-metadata-updater.timer
sudo systemctl start cdr-metadata-updater.timer

# Check status
sudo systemctl status cdr-metadata-updater.timer
sudo journalctl -u cdr-metadata-updater.service -f
```

## Manual Run

You can also run the script manually anytime:

```bash
./scripts/update_cdr_metadata.sh
```

## What It Updates

1. **recording_url** - Copies from `userfield` column
2. **caller_id** - Copies from `clid` column (Asterisk Caller ID)
3. **destination** - Copies from `dst` column (Asterisk destination)
4. **call_date** - Copies from `calldate` column
5. **direction** - Auto-detects based on:
   - `inbound` - Calls from Twilio trunk
   - `outbound` - Calls via outbound context
   - `internal` - Extension-to-extension calls
