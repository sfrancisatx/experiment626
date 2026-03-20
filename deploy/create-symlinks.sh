#!/bin/bash
set -e

echo "=== Creating Symbolic Links to Deploy Scripts ==="
echo ""

# Get the current user's home directory
USER_HOME="$HOME"
DEPLOY_DIR="/opt/experiment626/deploy"

echo "Creating symlinks in: $USER_HOME"
echo "Linking to scripts in: $DEPLOY_DIR"
echo ""

# Create symlinks for the main deployment scripts
ln -sf "$DEPLOY_DIR/deploy.sh" "$USER_HOME/deploy.sh"
echo "✓ Created symlink: ~/deploy.sh -> $DEPLOY_DIR/deploy.sh"

ln -sf "$DEPLOY_DIR/update.sh" "$USER_HOME/update.sh"
echo "✓ Created symlink: ~/update.sh -> $DEPLOY_DIR/update.sh"

# Make sure the scripts are executable
chmod +x "$DEPLOY_DIR/deploy.sh"
chmod +x "$DEPLOY_DIR/update.sh"
chmod +x "$DEPLOY_DIR/cleanup-pm2.sh"
chmod +x "$DEPLOY_DIR/setup-pm2-service.sh"

echo ""
echo "=== Symlinks Created Successfully! ==="
echo ""
echo "You can now run deployment scripts from your home directory:"
echo "  ~/deploy.sh  - Full deployment"
echo "  ~/update.sh  - Quick update"
echo ""
echo "These symlinks point to the scripts in the repository,"
echo "so they'll always use the latest version from git."
