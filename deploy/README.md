# Experiment626 Deployment Guide

This directory contains scripts and configuration files for deploying Experiment626 to Google Cloud Platform (GCP).

## Deployment Scripts

- **`setup-pm2-service.sh`** - One-time setup to configure PM2 as a systemd service
- **`cleanup-pm2.sh`** - Clean up existing PM2 instances before setup
- **`deploy.sh`** - Full deployment (dependencies, build, restart)
- **`update.sh`** - Quick update (only rebuilds what changed)
- **`sudoers-pm2`** - Sudoers configuration for passwordless PM2 access

## Prerequisites

1. **Install Google Cloud SDK**
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate with GCP**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. **Have your billing account ID ready**
   - Find it at: https://console.cloud.google.com/billing

## Quick Start Deployment

### Step 1: Set Up GCP Project and VM

Run the automated setup script:

```bash
cd deploy
chmod +x gcp-setup.sh
./gcp-setup.sh
```

This will:
- Create a new GCP project
- Enable required APIs (Compute Engine, Storage, Logging)
- Create firewall rules for HTTP/HTTPS
- Create an e2-micro VM instance (free tier eligible)
- Output the VM's external IP address

**Save the output!** You'll need the project ID, zone, and external IP.

### Step 2: Configure the VM

SSH into your new VM:

```bash
gcloud compute ssh experiment626-vm --zone=us-central1-a
```

Once connected, upload and run the setup script:

```bash
# On your local machine, copy the setup script to the VM
gcloud compute scp setup-vm.sh experiment626-vm:~/ --zone=us-central1-a

# SSH back into the VM
gcloud compute ssh experiment626-vm --zone=us-central1-a

# Run the setup script
chmod +x setup-vm.sh
./setup-vm.sh
```

This installs:
- Node.js 20
- nginx
- PM2 (process manager)
- PostgreSQL (for future use)
- git

### Step 3: Deploy Your Code

**First, update the repository URL in `deploy.sh`:**

Edit `deploy/deploy.sh` and replace:
```bash
REPO_URL="https://github.com/yourusername/experiment626.git"
```

Then copy the deployment script to the VM:

```bash
# On your local machine
gcloud compute scp deploy.sh experiment626-vm:~/ --zone=us-central1-a
gcloud compute scp nginx.conf experiment626-vm:~/ --zone=us-central1-a

# SSH into the VM
gcloud compute ssh experiment626-vm --zone=us-central1-a

# Run deployment
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Configure nginx

```bash
# On the VM
sudo cp ~/nginx.conf /etc/nginx/sites-available/experiment626
sudo ln -s /etc/nginx/sites-available/experiment626 /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 5: Set Up PM2 System Service

**Important:** PM2 should be configured as a systemd service for shared access between developers.

```bash
# On the VM
cd /opt/experiment626/deploy

# First, clean up any existing PM2 instances
sudo ./cleanup-pm2.sh

# Then set up PM2 as a system service
sudo ./setup-pm2-service.sh
```

This configures PM2 to run as a systemd service that both developers can control using `sudo pm2` commands.

### Step 6: Test Your Deployment

Your server should now be accessible at:
- `http://YOUR_VM_IP` (WebSocket and HTTP)
- `http://YOUR_VM_IP/hello_world` (health check)

Test the WebSocket connection:
```bash
curl http://YOUR_VM_IP/hello_world
```

## PM2 System Service Setup

**First-time setup only:** Configure PM2 as a systemd service for shared access:

```bash
# SSH into the VM
gcloud compute ssh experiment626-vm --zone=us-central1-a

# Run the PM2 setup script (one-time only)
cd /opt/experiment626/deploy
sudo ./setup-pm2-service.sh
```

This configures PM2 to run as a system service that both developers can control.

## Updating Your Deployment

To deploy updates:

```bash
# SSH into the VM
gcloud compute ssh experiment626-vm --zone=us-central1-a

# Run the deploy script
cd ~
./deploy.sh
```

## Monitoring

**Note:** All PM2 commands now require `sudo` since PM2 runs as a system service.

View server logs:
```bash
sudo pm2 logs experiment626
```

Check server status:
```bash
sudo pm2 status
```

Restart server:
```bash
sudo pm2 restart experiment626
```

Monitor in real-time:
```bash
sudo pm2 monit
```

## Client Deployment (Static Files)

The client will be deployed to Cloud Storage + CDN separately. Instructions coming soon.

## Costs

With the e2-micro instance (free tier):
- **VM**: $0/month (within free tier limits)
- **Egress**: First 1 GB/month free, then ~$0.12/GB
- **Storage**: Negligible for boot disk

**Total estimated cost: $0-5/month** for modest traffic.

## Troubleshooting

### Server won't start
```bash
# Check logs
sudo pm2 logs experiment626

# Check if port 5111 is in use
sudo netstat -tulpn | grep 5111

# Restart nginx
sudo systemctl restart nginx
```

### Can't connect from client
- Verify firewall rules: `gcloud compute firewall-rules list`
- Check nginx status: `sudo systemctl status nginx`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

### VM is slow
- e2-micro has limited CPU (shared cores). Upgrade to e2-small if needed:
  ```bash
  gcloud compute instances stop experiment626-vm --zone=us-central1-a
  gcloud compute instances set-machine-type experiment626-vm --machine-type=e2-small --zone=us-central1-a
  gcloud compute instances start experiment626-vm --zone=us-central1-a
  ```

## Future Enhancements

- [ ] Add HTTPS with Let's Encrypt
- [ ] Set up PostgreSQL database
- [ ] Implement game state persistence
- [ ] Add Firebase Authentication
- [ ] Set up Cloud Monitoring alerts
- [ ] Deploy client to Cloud Storage + CDN

### Notes to myself: 
Next steps:
1. SSH into the VM
2. Run the setup-vm.sh script
3. Clone your repository and deploy

Save this information:
  Project ID: experiment626-sandbox
  VM Name: experiment626-vm
  Zone: us-central1-a
  External IP: 34.55.96.153 (static)

  The key fingerprint is:
SHA256:XOHGvDeG9djCKhCwSqDIkTE3nx0Oh35h2XHb/+pWLZw sfrancis@Scotts-MacBook-Pro.local
The key's randomart image is:
+---[RSA 3072]----+
|.+oo...oo.o.     |
|+o+ o+*+.=..o    |
|o.. oooo. *...   |
| . . . + o = +.  |
|  .   o S o B.oo.|
|       .   + oE +|
|        . .    o.|
|         .    .. |
|             oo  |
+----[SHA256]-----+