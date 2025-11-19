#!/bin/bash

# Setup sudo permissions for fail2ban commands without password
# This allows the backend API to manage fail2ban

echo "Setting up sudo permissions for fail2ban commands..."

# Create sudoers file for fail2ban commands
cat > /tmp/fail2ban-api << 'EOF'
# Allow backend API user to run fail2ban commands without password
# Add your backend user here (e.g., www-data, ubuntu, etc.)
%sudo ALL=(ALL) NOPASSWD: /usr/bin/fail2ban-client
%sudo ALL=(ALL) NOPASSWD: /bin/grep * /var/log/syslog
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/fail2ban-client
ubuntu ALL=(ALL) NOPASSWD: /bin/grep * /var/log/syslog
EOF

# Install sudoers file
sudo cp /tmp/fail2ban-api /etc/sudoers.d/fail2ban-api
sudo chmod 0440 /etc/sudoers.d/fail2ban-api
sudo chown root:root /etc/sudoers.d/fail2ban-api

# Verify sudoers file
if sudo visudo -cf /etc/sudoers.d/fail2ban-api; then
    echo "✅ Sudoers file installed successfully"
    echo ""
    echo "The following commands can now be run without password:"
    echo "  - sudo fail2ban-client status"
    echo "  - sudo fail2ban-client set <jail> banip <ip>"
    echo "  - sudo fail2ban-client set <jail> unbanip <ip>"
    echo "  - sudo grep BLOCKED-SIP: /var/log/syslog"
else
    echo "❌ Error: Invalid sudoers file"
    sudo rm -f /etc/sudoers.d/fail2ban-api
    exit 1
fi

echo ""
echo "Testing sudo commands..."
if sudo fail2ban-client status asterisk >/dev/null 2>&1; then
    echo "✅ fail2ban-client command works"
else
    echo "⚠️  Warning: fail2ban-client test failed (may need to run as correct user)"
fi

echo ""
echo "Setup complete!"
