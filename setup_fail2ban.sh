#!/bin/bash
# Install and configure fail2ban for Asterisk

set -e

echo "Installing fail2ban..."
sudo apt-get update -qq
sudo apt-get install -y fail2ban

echo "Creating Asterisk fail2ban filter..."
sudo tee /etc/fail2ban/filter.d/asterisk.conf > /dev/null << 'FILTER'
[Definition]
failregex = NOTICE.* .*: Registration from '.*' failed for '<HOST>(:[0-9]{1,5})?' - Wrong password
            NOTICE.* .*: Registration from '.*' failed for '<HOST>(:[0-9]{1,5})?' - No matching peer found
            NOTICE.* .*: Registration from '.*' failed for '<HOST>(:[0-9]{1,5})?' - Username/auth name mismatch
            NOTICE.* .*: Registration from '.*' failed for '<HOST>(:[0-9]{1,5})?' - Device does not match ACL
            NOTICE.* .*: Registration from '.*' failed for '<HOST>(:[0-9]{1,5})?' - Peer is not supposed to register
            NOTICE.* .*: Registration from '.*' failed for '<HOST>(:[0-9]{1,5})?' - ACL error
            NOTICE.* .*: Registration from '.*' failed for '<HOST>(:[0-9]{1,5})?' - Not a local domain
            NOTICE.* <HOST> failed to authenticate as '.*'$
            NOTICE.* .*: No registration for peer '.*' \(from <HOST>\)
            NOTICE.* .*: Host <HOST> failed MD5 authentication
            NOTICE.* .*: Failed to authenticate device .*<HOST>
            VERBOSE.* logger.c: -- .*IP/<HOST>-.*
            WARNING.* .*: Friendly scanner from <HOST>

ignoreregex =
FILTER

echo "Creating fail2ban jail configuration..."
sudo tee /etc/fail2ban/jail.d/asterisk.conf > /dev/null << 'JAIL'
[asterisk]
enabled = true
filter = asterisk
action = iptables-allports[name=ASTERISK]
logpath = /var/log/asterisk/messages
         /var/log/asterisk/full
maxretry = 3
findtime = 300
bantime = 3600
JAIL

echo "Configuring Docker log access..."
# Create symbolic link to Docker logs if needed
sudo mkdir -p /var/log/asterisk
if [ ! -f /var/log/asterisk/messages ]; then
    echo "Note: Configure Asterisk to log to /var/log/asterisk/messages"
fi

echo "Restarting fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

echo ""
echo "✅ Fail2ban configured!"
echo ""
echo "Status:"
sudo fail2ban-client status asterisk 2>/dev/null || echo "Jail will activate once log files are available"
echo ""
echo "Configuration:"
echo "  - Max retries: 3"
echo "  - Find time: 5 minutes"
echo "  - Ban time: 1 hour"
echo "  - Action: Block all ports from offending IP"
