#!/bin/bash
set -euo pipefail

TEMPLATE_DIR=/usr/local/share/asterisk-templates
ETC_DIR=/etc/asterisk

echo "Initializing Asterisk config..."
# If /etc/asterisk is empty (e.g., first run with host volume), populate from templates
shopt -s nullglob
if [ -z "$(ls -A $ETC_DIR)" ]; then
  echo "/etc/asterisk is empty, copying default templates"
  cp -R $TEMPLATE_DIR/* $ETC_DIR/
fi

# Render any .tpl files in /etc/asterisk
for tpl in $ETC_DIR/*.tpl; do
  [ -e "$tpl" ] || continue
  outfile="${tpl%.tpl}"
  echo "Rendering $tpl -> $outfile"
  envsubst < "$tpl" > "$outfile"
done

# Ensure permissions
chown -R root:root $ETC_DIR || true

echo "Starting Asterisk"
exec "$@"
