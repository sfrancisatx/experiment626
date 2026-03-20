#!/bin/bash
set -e

echo "=== PM2 System Service Setup ==="
echo "This script will configure PM2 as a systemd service accessible to all users"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root: sudo ./setup-pm2-service.sh"
   exit 1
fi

echo "Step 1: Cleaning up existing PM2 instances..."

# Stop and kill PM2 for all users
for user in sfrancis hollandfrancis; do
    echo "  Cleaning up PM2 for user: $user"
    sudo -u $user pm2 kill 2>/dev/null || true
    sudo -u $user rm -rf /home/$user/.pm2 2>/dev/null || true
done

echo "✓ Cleaned up existing PM2 instances"
echo ""

echo "Step 2: Installing PM2 globally (if not already installed)..."
npm list -g pm2 || npm install -g pm2
echo "✓ PM2 installed globally"
echo ""

echo "Step 3: Setting up PM2 as systemd service..."

# Generate PM2 startup script for systemd
pm2 startup systemd -u root --hp /root

echo ""
echo "Step 4: Configuring sudoers for passwordless PM2 access..."

# Create sudoers file for PM2 commands
cat > /etc/sudoers.d/pm2-access << 'EOF'
# Allow sfrancis and hollandfrancis to run PM2 commands without password
sfrancis ALL=(ALL) NOPASSWD: /usr/bin/pm2
hollandfrancis ALL=(ALL) NOPASSWD: /usr/bin/pm2
EOF

chmod 0440 /etc/sudoers.d/pm2-access

# Verify sudoers syntax
visudo -c -f /etc/sudoers.d/pm2-access

echo "✓ Sudoers configured for passwordless PM2 access"
echo ""

echo "Step 5: Enabling PM2 systemd service..."
systemctl enable pm2-root
systemctl start pm2-root

echo "✓ PM2 systemd service enabled and started"
echo ""

echo "=== Setup Complete! ==="
echo ""
echo "PM2 is now running as a system service."
echo "Both users can control it using:"
echo "  sudo pm2 status"
echo "  sudo pm2 logs experiment626"
echo "  sudo pm2 restart experiment626"
echo ""
echo "Logs are located in: /root/.pm2/logs/"
echo ""
echo "Next steps:"
echo "1. Deploy your application: cd ~ && ./deploy.sh"
echo "2. Verify it's running: sudo pm2 status"
echo "3. Check logs: sudo pm2 logs experiment626"
