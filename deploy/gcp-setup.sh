#!/bin/bash
set -e

echo "=== GCP Project Setup Script ==="
echo "This script will create and configure your GCP project for Experiment626"
echo ""

# Prompt for project details
read -p "Enter your GCP Project ID (e.g., experiment626-prod): " PROJECT_ID
read -p "Enter your billing account ID (find at console.cloud.google.com/billing): " BILLING_ACCOUNT
read -p "Enter your preferred region (default: us-central1): " REGION
REGION=${REGION:-us-central1}
ZONE="${REGION}-a"

echo ""
echo "Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Billing Account: $BILLING_ACCOUNT"
echo "  Region: $REGION"
echo "  Zone: $ZONE"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Aborted."
    exit 1
fi

# Create project
echo "Creating GCP project..."
gcloud projects create $PROJECT_ID --name="Experiment626"

# Link billing account
echo "Linking billing account..."
gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT

# Set default project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com

# Create firewall rules
echo "Creating firewall rules..."
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --target-tags http-server \
    --description "Allow HTTP traffic"

gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --target-tags https-server \
    --description "Allow HTTPS traffic"

# Create VM instance
echo "Creating VM instance..."
gcloud compute instances create experiment626-vm \
    --machine-type=e2-micro \
    --zone=$ZONE \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=10GB \
    --boot-disk-type=pd-standard \
    --tags=http-server,https-server \
    --metadata=startup-script='#!/bin/bash
    echo "VM started at $(date)" > /var/log/startup.log
    '

# Get VM external IP
EXTERNAL_IP=$(gcloud compute instances describe experiment626-vm --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "VM External IP: $EXTERNAL_IP"
echo "SSH into VM: gcloud compute ssh experiment626-vm --zone=$ZONE"
echo ""
echo "Next steps:"
echo "1. SSH into the VM"
echo "2. Run the setup-vm.sh script"
echo "3. Clone your repository and deploy"
echo ""
echo "Save this information:"
echo "  Project ID: $PROJECT_ID"
echo "  VM Name: experiment626-vm"
echo "  Zone: $ZONE"
echo "  External IP: $EXTERNAL_IP"
