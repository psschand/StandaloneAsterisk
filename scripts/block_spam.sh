#!/usr/bin/env bash
set -euo pipefail

BLACKLIST_FILE="$(dirname "$0")/spam_blacklist.txt"
CHAIN_NAME="SIP-BLACKLIST"

if ! sudo iptables -L "$CHAIN_NAME" -n >/dev/null 2>&1; then
  echo "Creating chain $CHAIN_NAME"
  sudo iptables -N "$CHAIN_NAME"
  # insert jump from INPUT to our chain if not present
  if ! sudo iptables -C INPUT -j "$CHAIN_NAME" >/dev/null 2>&1; then
    sudo iptables -I INPUT -j "$CHAIN_NAME"
  fi
fi

echo "Applying blacklist from $BLACKLIST_FILE"
while read -r ip; do
  ip="$(echo "$ip" | sed 's/#.*//' | xargs)"
  [ -z "$ip" ] && continue
  if ! sudo iptables -C "$CHAIN_NAME" -s "$ip" -j DROP >/dev/null 2>&1; then
    echo "Blocking $ip"
    sudo iptables -A "$CHAIN_NAME" -s "$ip" -j DROP
  else
    echo "$ip already blocked"
  fi
done < "$BLACKLIST_FILE"

echo "Done." 
 
