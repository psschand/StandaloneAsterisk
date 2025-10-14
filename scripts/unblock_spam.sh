#!/usr/bin/env bash
set -euo pipefail

CHAIN_NAME="SIP-BLACKLIST"

if sudo iptables -L "$CHAIN_NAME" -n >/dev/null 2>&1; then
  echo "Flushing rules in $CHAIN_NAME"
  sudo iptables -F "$CHAIN_NAME"
  if sudo iptables -C INPUT -j "$CHAIN_NAME" >/dev/null 2>&1; then
    sudo iptables -D INPUT -j "$CHAIN_NAME"
  fi
  echo "Deleting chain $CHAIN_NAME"
  sudo iptables -X "$CHAIN_NAME"
else
  echo "Chain $CHAIN_NAME does not exist"
fi
 

