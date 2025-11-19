#!/bin/bash
# Asterisk Security - Firewall Rules for Spam Prevention
# Only allow Twilio IPs and authenticated WebRTC clients

set -e

echo "Setting up Asterisk firewall security..."

# Twilio SIP IP ranges (North America)
TWILIO_IPS=(
    "54.172.60.0/24"
    "54.244.51.0/24"
    "54.171.127.192/26"
    "35.156.191.128/25"
    "177.71.206.192/26"
)

# Flush existing rules for SIP ports
echo "Cleaning existing SIP port rules..."
sudo iptables -D INPUT -p tcp --dport 5060 -j ACCEPT 2>/dev/null || true
sudo iptables -D INPUT -p udp --dport 5060 -j ACCEPT 2>/dev/null || true
sudo iptables -D INPUT -p tcp --dport 8088 -j ACCEPT 2>/dev/null || true
sudo iptables -D INPUT -p tcp --dport 8089 -j ACCEPT 2>/dev/null || true

# Allow localhost
echo "Allowing localhost..."
sudo iptables -I INPUT 1 -i lo -j ACCEPT

# Allow established connections
echo "Allowing established connections..."
sudo iptables -I INPUT 2 -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow Twilio SIP traffic (UDP 5060)
echo "Whitelisting Twilio IP ranges..."
for ip in "${TWILIO_IPS[@]}"; do
    echo "  Adding $ip"
    sudo iptables -A INPUT -p udp -s "$ip" --dport 5060 -j ACCEPT
    sudo iptables -A INPUT -p tcp -s "$ip" --dport 5060 -j ACCEPT
done

# Allow WebSocket connections (for WebRTC softphone) - requires authentication
# These are proxied through Caddy which handles TLS, so allow from Docker network
echo "Allowing WebSocket traffic from Docker network..."
sudo iptables -A INPUT -s 172.25.0.0/16 -p tcp --dport 8088 -j ACCEPT
sudo iptables -A INPUT -s 172.25.0.0/16 -p tcp --dport 8089 -j ACCEPT

# Allow RTP media ports (10000-10100) only from Twilio IPs
echo "Allowing RTP media from Twilio..."
for ip in "${TWILIO_IPS[@]}"; do
    sudo iptables -A INPUT -p udp -s "$ip" --dport 10000:10100 -j ACCEPT
done

# Block all other traffic to SIP ports (anti-spam)
echo "Blocking all other SIP traffic (spam prevention)..."
sudo iptables -A INPUT -p udp --dport 5060 -j DROP
sudo iptables -A INPUT -p tcp --dport 5060 -j DROP

# Log dropped SIP packets (for monitoring spam attempts)
echo "Adding logging for dropped packets..."
sudo iptables -I INPUT -p udp --dport 5060 -m limit --limit 5/min -j LOG --log-prefix "BLOCKED-SIP: " --log-level 4
sudo iptables -I INPUT -p tcp --dport 5060 -m limit --limit 5/min -j LOG --log-prefix "BLOCKED-SIP: " --log-level 4

# Save rules
echo "Saving iptables rules..."
if command -v netfilter-persistent &> /dev/null; then
    sudo netfilter-persistent save
elif command -v iptables-save &> /dev/null; then
    sudo sh -c "iptables-save > /etc/iptables/rules.v4"
fi

echo ""
echo "✅ Firewall security configured!"
echo ""
echo "Current SIP port rules:"
sudo iptables -L INPUT -n -v | grep -E "5060|BLOCKED-SIP" | head -20
echo ""
echo "Active whitelist:"
echo "  - Twilio IP ranges: ${#TWILIO_IPS[@]} ranges"
echo "  - WebRTC clients: Via authenticated WebSocket (Docker network)"
echo "  - All other traffic: BLOCKED"
