# Cloud Architecture & Deployment Plan

## Overview
This document outlines the cloud architecture and deployment strategy for Experiment626 on Google Cloud Platform (GCP), focusing on scalability, reliability, and cost-effectiveness for the real-time galactic conquest game.

## Current Architecture Analysis

### Existing Setup
- **Server**: Node.js/Colyseus on `ws://localhost:5111`
- **Client**: React/Vite dev server on port 3000
- **Database**: None (in-memory only)
- **Static Files**: Express static serving
- **Real-time**: WebSocket connections for game state
- **Authentication**: None currently (planned user management)

### Current Limitations
- Single-server deployment
- No data persistence
- No scaling capability
- Development-only configuration

## Target GCP Architecture

### Architecture Diagram
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloud CDN     │    │   Cloud Run      │    │   Cloud SQL     │
│   (Static)      │────│   (Game Server)  │────│   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Cloud Run      │    │   Redis         │
│   (Auth)        │────│   (API Server)   │────│   (Sessions)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloud Armor    │    │   Cloud Run      │    │   Cloud Storage │
│   (DDoS)        │────│   (Background)   │────│   (Assets)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### GCP Services Breakdown

#### **Compute Services**
- **Cloud Run**: Serverless containers for game server and API
- **Cloud Build**: CI/CD pipeline and container building
- **Cloud Scheduler**: For background tasks and maintenance

#### **Database & Storage**
- **Cloud SQL**: Managed PostgreSQL for user data and game persistence
- **Redis Memorystore**: Session storage and real-time caching
- **Cloud Storage**: Static assets and game media
- **Cloud CDN**: Global content delivery for static assets

#### **Networking & Security**
- **Cloud Load Balancer**: Traffic distribution and SSL termination
- **Cloud Armor**: DDoS protection and security policies
- **VPC Connector**: Secure service-to-service communication

#### **Identity & Management**
- **Firebase Authentication**: User management and authentication
- **Cloud IAM**: Access control and permissions
- **Cloud Monitoring**: Performance monitoring and alerting
- **Cloud Logging**: Centralized log management

## Detailed Service Configuration

### **Cloud Run - Game Server**
```yaml
# service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: experiment626-game-server
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "100"
        autoscaling.knative.dev/minScale: "1"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 100
      containers:
        - image: gcr.io/project-id/experiment626-server:latest
          ports:
            - containerPort: 2567
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: url
          resources:
            limits:
              cpu: "1000m"
              memory: "512Mi"
```

### **Cloud SQL - PostgreSQL**
```hcl
# terraform/sql.tf
resource "google_sql_database_instance" "main" {
  name             = "experiment626-db"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier = "db-custom-4-16384"
    
    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "cloud-run"
        value = "0.0.0.0/0" # Restrict to Cloud Run in production
      }
    }
    
    backup_configuration {
      enabled = true
      location = var.region
    }
  }
  
  deletion_protection = false
}

resource "google_sql_database" "users" {
  name     = "experiment626_users"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_database" "game" {
  name     = "experiment626_game"
  instance = google_sql_database_instance.main.name
}
```

### **Redis Memorystore**
```hcl
# terraform/redis.tf
resource "google_redis_instance" "sessions" {
  name           = "experiment626-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = 4
  region         = var.region
  
  authorized_network = google_compute_network.redis_network.id
  
  redis_version     = "REDIS_7_0"
  display_name      = "Experiment626 Session Store"
}
```

## Application Changes Required

### **Environment Configuration**
```typescript
// src/config/environment.ts
export const config = {
  port: parseInt(process.env.PORT || '2567'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost/experiment626',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'experiment626:',
  },
  
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
};
```

### **Docker Configuration**
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN npm run build

EXPOSE 2567

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:2567/health || exit 1

CMD ["npm", "start"]
```

### **Client Configuration**
```typescript
// src/config/client.ts
export const clientConfig = {
  gameServerUrl: process.env.NODE_ENV === 'production' 
    ? 'wss://game-server-experiment626.run.app'
    : 'ws://localhost:5111',
    
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://api-server-experiment626.run.app'
    : 'http://localhost:8080',
    
  firebaseConfig: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    // ... other Firebase config
  },
};
```

## Deployment Pipeline

### **CI/CD Configuration**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GCP

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  PROJECT_ID: your-gcp-project-id
  REGION: us-central1

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: 'write'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.SERVICE_ACCOUNT }}
      
      - name: Setup Google Cloud
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ env.PROJECT_ID }}
      
      - name: Build and Push Server
        run: |
          cd experiment626-server
          gcloud builds submit --tag gcr.io/${{ env.PROJECT_ID }}/experiment626-server:${{ github.sha }}
          gcloud builds submit --tag gcr.io/${{ env.PROJECT_ID }}/experiment626-server:latest
      
      - name: Deploy Server
        run: |
          gcloud run deploy experiment626-game-server \
            --image gcr.io/${{ env.PROJECT_ID }}/experiment626-server:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars NODE_ENV=production
      
      - name: Build and Deploy Client
        run: |
          cd experiment626-client
          npm run build
          gsutil -m rsync -r dist gs://experiment626-client
          gsutil web set -m index.html -e 404.html gs://experiment626-client
```

## Scaling Strategy

### **Auto-scaling Configuration**
```yaml
# Cloud Run autoscaling settings
autoscaling:
  minInstances: 1    # Keep at least 1 instance warm
  maxInstances: 100   # Scale up to 100 instances
  concurrency: 100    # 100 concurrent requests per instance
  cpu: 1000m         # 1 vCPU per instance
  memory: 512Mi      # 512MB RAM per instance
```

### **Database Scaling**
- **Read Replicas**: Add read replicas for game state queries
- **Connection Pooling**: PgBouncer for efficient database connections
- **Backup Strategy**: Daily automated backups with point-in-time recovery
- **Monitoring**: Database performance metrics and alerting

### **Redis Scaling**
- **Cluster Mode**: For high availability and scaling
- **Memory Management**: TTL policies for session data
- **Monitoring**: Memory usage and hit rate metrics

## Security Configuration

### **Network Security**
```hcl
# terraform/security.tf
resource "google_cloud_armor_security_policy" "main" {
  name        = "experiment626-security-policy"
  description = "Security policy for Experiment626"
  
  rule {
    action      = "allow"
    priority    = "1000"
    description = "Allow all traffic initially"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
  
  rule {
    action      = "deny"
    priority    = "999"
    description = "Deny known malicious IPs"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["192.0.2.0/24"] # Example malicious range
      }
    }
    deny {
      status_code = 403
    }
  }
}
```

### **Secret Management**
```bash
# Set up secrets
gcloud secrets create db-credentials
gcloud secrets versions add db-credentials --data-file=db-credentials.json

gcloud secrets create redis-credentials
gcloud secrets versions add redis-credentials --data-file=redis-credentials.json

gcloud secrets create jwt-secret
echo -n "your-jwt-secret" | gcloud secrets versions add jwt-secret --data-file=-
```

## Monitoring & Observability

### **Cloud Monitoring Dashboard**
```yaml
# monitoring/dashboard.yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringDashboard
metadata:
  name: experiment626-dashboard
spec:
  displayName: "Experiment626 Game Dashboard"
  gridLayout:
    columns: "2"
    widgets:
      - title: "Active Players"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                prometheusQuery:
                  query: "sum(colyseus_connected_clients)"
      - title: "Response Time"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                prometheusQuery:
                  query: "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
```

### **Alerting Configuration**
```yaml
# monitoring/alerts.yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: AlertPolicy
metadata:
  name: experiment626-alerts
spec:
  displayName: "Experiment626 Alerts"
  conditions:
    - displayName: "High Error Rate"
      conditionThreshold:
        filter: "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\""
        aggregations:
          - alignmentPeriod: "300s"
            perSeriesAligner: "ALIGN_RATE"
        comparison: "COMPARISON_GT"
        thresholdValue: 0.1
        duration: "300s"
```

## Cost Optimization

### **Monthly Cost Estimates**
| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Cloud Run | $50-200 | Based on player traffic |
| Cloud SQL | $25-100 | PostgreSQL tier |
| Redis | $15-50 | Memorystore tier |
| Cloud CDN | $10-30 | Static asset delivery |
| Cloud Build | $5-20 | CI/CD pipeline |
| **Total** | **$105-400** | Depending on usage |

### **Cost Optimization Strategies**
1. **Right-sizing**: Monitor and adjust instance sizes
2. **Scheduled Scaling**: Scale down during off-peak hours
3. **CDN Caching**: Aggressive caching for static assets
4. **Database Optimization**: Query optimization and indexing
5. **Reserved Capacity**: Consider committed use discounts

## Migration Strategy

### **Phase 1: Infrastructure Setup (Week 1-2)**
1. Create GCP project and set up billing
2. Configure Terraform infrastructure
3. Set up CI/CD pipeline
4. Deploy staging environment

### **Phase 2: Database Migration (Week 3)**
1. Set up Cloud SQL instance
2. Create database schema
3. Implement migration scripts
4. Test data migration

### **Phase 3: Application Migration (Week 4)**
1. Containerize applications
2. Deploy to staging environment
3. Test integration and performance
4. Security and penetration testing

### **Phase 4: Production Cutover (Week 5)**
1. DNS configuration
2. Zero-downtime deployment
3. Monitor performance
4. Rollback plan if needed

## Disaster Recovery

### **Backup Strategy**
- **Database**: Daily automated backups with 30-day retention
- **Static Assets**: Cross-region replication
- **Configuration**: Version control and infrastructure as code

### **Recovery Procedures**
1. **Database Recovery**: Point-in-time recovery from backups
2. **Application Recovery**: Redeploy from container registry
3. **DNS Failover**: Route traffic to backup region

## Performance Optimization

### **Game Server Optimization**
- **Connection Pooling**: Efficient database connections
- **Memory Management**: Monitor and optimize memory usage
- **Load Testing**: Regular performance testing

### **Client Optimization**
- **Asset Optimization**: Compress and cache static assets
- **Lazy Loading**: Load game assets on demand
- **Network Optimization**: Minimize WebSocket message size

---

This architecture provides a scalable, secure, and cost-effective foundation for Experiment626 on Google Cloud Platform, supporting both current functionality and future user management features.
