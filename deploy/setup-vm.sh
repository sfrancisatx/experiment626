#!/bin/bash
set -e

echo "=== Experiment626 VM Setup Script ==="
echo "This script installs all dependencies on a fresh Ubuntu VM"

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install nginx
echo "Installing nginx..."
sudo apt-get install -y nginx

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Install git
echo "Installing git..."
sudo apt-get install -y git

# Install PostgreSQL (for future use)
echo "Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# Create app directory
echo "Creating app directory..."
sudo mkdir -p /opt/experiment626
sudo chown -R $USER:$USER /opt/experiment626

echo "=== Setup complete! ==="
echo "Next steps:"
echo "1. Clone your repository to /opt/experiment626"
echo "2. Run npm install in the server directory"
echo "3. Configure nginx (see nginx.conf)"
echo "4. Start the app with PM2"
