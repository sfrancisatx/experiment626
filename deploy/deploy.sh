#!/bin/bash
set -e
umask 002


echo "=== Experiment626 Deployment Script ==="

# Configuration
APP_DIR="/opt/experiment626"
REPO_URL="https://github.com/sfrancisatx/experiment626.git"
SERVER_DIR="$APP_DIR/experiment626-server"
CLIENT_DIR="$APP_DIR/experiment626-client"
WEB_ROOT="/var/www/experiment626"

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
npm ci

echo "Generating Prisma Client..."
npx prisma generate

echo "Building server..."
npm run build

# Copy ecosystem config to a location accessible by root
echo "Copying PM2 ecosystem config..."
sudo cp ~/ecosystem.config.js $SERVER_DIR/

# Stop existing PM2 process if running
echo "Stopping existing server..."
sudo pm2 stop experiment626 || true
sudo pm2 delete experiment626 || true

# Start server with PM2 using ecosystem file
echo "Starting server with PM2..."
cd $SERVER_DIR
sudo pm2 start ecosystem.config.js

# Save PM2 process list
sudo pm2 save

# Show status
sudo pm2 status

# Build and deploy client
echo "Building client..."
cd $CLIENT_DIR
npm ci
npm run build

echo "Deploying client to web root..."
sudo mkdir -p $WEB_ROOT
sudo rm -rf $WEB_ROOT/*
sudo cp -r dist/* $WEB_ROOT/
sudo chown -R www-data:www-data $WEB_ROOT

echo "=== Deployment complete! ==="
echo "Server is running on port 5111"
echo "Client is deployed to $WEB_ROOT"
echo "Access the app at: http://YOUR_VM_IP"
echo "Check logs with: sudo pm2 logs experiment626"
