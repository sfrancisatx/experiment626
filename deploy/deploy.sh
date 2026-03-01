#!/bin/bash
set -e

echo "=== Experiment626 Deployment Script ==="

# Configuration
APP_DIR="/opt/experiment626"
REPO_URL="https://github.com/sfrancisatx/experiment626.git"
SERVER_DIR="$APP_DIR/experiment626-server"

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo "Updating repository..."
    cd $APP_DIR
    git pull
else
    echo "Cloning repository..."
    git clone $REPO_URL $APP_DIR
fi

# Install server dependencies and build
echo "Installing server dependencies..."
cd $SERVER_DIR
npm ci --only=production

echo "Building server..."
npm run build

# Stop existing PM2 process if running
echo "Stopping existing server..."
pm2 stop experiment626 || true
pm2 delete experiment626 || true

# Start server with PM2
echo "Starting server with PM2..."
pm2 start npm --name "experiment626" -- start

# Save PM2 process list
pm2 save

# Show status
pm2 status

echo "=== Deployment complete! ==="
echo "Server is running on port 5111"
echo "Check logs with: pm2 logs experiment626"
