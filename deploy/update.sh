#!/bin/bash
set -e
umask 002


echo "=== Experiment626 Quick Update ==="

# Configuration
APP_DIR="/opt/experiment626"
SERVER_DIR="$APP_DIR/experiment626-server"
CLIENT_DIR="$APP_DIR/experiment626-client"
WEB_ROOT="/var/www/experiment626"

# Pull latest code
echo "Pulling latest code..."
cd $APP_DIR
git pull

# Only rebuild if package.json changed
if git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
    echo "Package.json changed, installing dependencies..."
    cd $SERVER_DIR && npm ci
    cd $CLIENT_DIR && npm ci
fi

# Only rebuild server if server code changed
if git diff --name-only HEAD~1 HEAD | grep -q "^experiment626-server/"; then
    echo "Server code changed, rebuilding..."
    cd $SERVER_DIR
    npx prisma generate
    npm run build
    pm2 restart experiment626 || pm2 start ~/ecosystem.config.js
fi

# Only rebuild client if client code changed
if git diff --name-only HEAD~1 HEAD | grep -q "^experiment626-client/"; then
    echo "Client code changed, rebuilding..."
    cd $CLIENT_DIR
    npm run build
    sudo rm -rf $WEB_ROOT/*
    sudo cp -r dist/* $WEB_ROOT/
    sudo chown -R www-data:www-data $WEB_ROOT
fi

echo "=== Update complete! ==="
pm2 status