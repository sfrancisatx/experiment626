#!/bin/bash
set -e

echo "=== PM2 Cleanup Script ==="
echo "This script will stop and remove all existing PM2 instances for all users"
echo ""

# Check if running with appropriate permissions
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root: sudo ./cleanup-pm2.sh"
   exit 1
fi

echo "Cleaning up PM2 instances..."
echo ""

# List of users to clean up
USERS=("sfrancis" "hollandfrancis")

for user in "${USERS[@]}"; do
    if id "$user" &>/dev/null; then
        echo "Cleaning PM2 for user: $user"
        
        # Stop all PM2 processes for this user
        sudo -u $user pm2 stop all 2>/dev/null || true
        
        # Delete all PM2 processes
        sudo -u $user pm2 delete all 2>/dev/null || true
        
        # Kill the PM2 daemon
        sudo -u $user pm2 kill 2>/dev/null || true
        
        # Remove PM2 directory
        if [ -d "/home/$user/.pm2" ]; then
            echo "  Removing /home/$user/.pm2"
            rm -rf /home/$user/.pm2
        fi
        
        echo "  ✓ Cleaned up PM2 for $user"
    else
        echo "  ⚠ User $user does not exist, skipping"
    fi
    echo ""
done

# Also clean up root PM2 if it exists
echo "Cleaning PM2 for root user..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

if [ -d "/root/.pm2" ]; then
    echo "  Removing /root/.pm2"
    rm -rf /root/.pm2
fi
echo "  ✓ Cleaned up PM2 for root"
echo ""

# Check for any remaining PM2 processes
echo "Checking for remaining PM2 processes..."
PM2_PROCS=$(ps aux | grep -i pm2 | grep -v grep | wc -l)

if [ "$PM2_PROCS" -gt 0 ]; then
    echo "⚠ Warning: Found $PM2_PROCS PM2-related processes still running"
    echo "You may need to manually kill these processes:"
    ps aux | grep -i pm2 | grep -v grep
else
    echo "✓ No PM2 processes found"
fi

echo ""
echo "=== Cleanup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Run the setup script: sudo ./setup-pm2-service.sh"
echo "2. Deploy your application: ./deploy.sh"
