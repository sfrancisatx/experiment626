# Experiment626 Deployment Guide

This directory contains scripts and configuration files for deploying Experiment626 to Google Cloud Platform (GCP).

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

### Step 5: Enable PM2 Auto-Start

```bash
# On the VM
pm2 startup
# Follow the instructions it prints (copy/paste the command)
pm2 save
```

### Step 6: Test Your Deployment

Your server should now be accessible at:
- `http://YOUR_VM_IP` (WebSocket and HTTP)
- `http://YOUR_VM_IP/hello_world` (health check)

Test the WebSocket connection:
```bash
curl http://YOUR_VM_IP/hello_world
```

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

View server logs:
```bash
pm2 logs experiment626
```

Check server status:
```bash
pm2 status
```

Restart server:
```bash
pm2 restart experiment626
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
pm2 logs experiment626

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
