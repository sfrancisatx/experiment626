# Cloud Architecture & Deployment Plan (GCP)

## Overview
This document outlines the cloud architecture and deployment strategy for Experiment626 on **Google Cloud Platform (GCP)**. It builds on the current local setup (Colyseus server + React/Vite client) and the user management plan, with a focus on:
- Scalability for multi-week games
- Reliability for long-lived sessions
- Reasonable cost for an indie project

## Current Local Architecture

- **Server**: Colyseus-based Node.js server (TypeScript) in `experiment626-server`
  - Uses `@colyseus/tools` to bootstrap
  - Rooms: `LobbyRoom`, `Galaxy`, etc.
  - Serves static files (including `landing.html`)
  - WebSocket endpoint currently at `ws://localhost:5111`

- **Client**: React (Vite) in `experiment626-client`
  - `LandingPageReact` for lobby/game selection
  - Static HTML landing page under `/public/landing.html`
  - Dev server on port 3000

- **Database**: None yet (in-memory game state only)

## Target GCP Architecture

### High-Level Diagram

```
┌──────────────────────────────┐
│          Cloud CDN           │
│      (Static Frontend)       │
└──────────────┬───────────────┘
               │
       HTTPS   │
               ▼
┌──────────────────────────────┐
│     Cloud Run (Game Server)  │
│  Colyseus (WS) + Express    │
│  (auth middleware, user API) │
└──────────────┬───────────────┘
               │
               │VPC (private)
               ▼
      ┌────────────────┐   ┌──────────────────┐
      │ Cloud SQL (PG) │   │ Redis Memorystore│
      │  Users, assoc, │   │ (Phase 2: room   │
      │  game snapshots│   │  presence/driver)│
      └────────────────┘   └──────────────────┘

      ┌────────────────┐
      │ Cloud Storage  │
      │ Static assets  │
      └────────────────┘
```

> **Note:** The diagram shows a single Cloud Run service. The current codebase
> already serves Express HTTP routes (auth, user API) alongside Colyseus on the
> same process. Splitting into a separate API service is a future option if the
> REST API needs independent scaling, but is not needed initially.

### GCP Services Chosen

- **Cloud Run**
  - Runs a single containerized Node.js service: `experiment626-game-server`
    - Colyseus game server (WebSocket)
    - Express routes: auth middleware, user API, monitoring
  - **Important:** Initially deploy as a **single instance** (`maxInstances: 1`). Colyseus rooms are pinned to the process that created them. Multi-instance scaling requires Redis presence/driver (see Phase 2 below).
  - Future option: split REST API into a separate `experiment626-api` service if independent scaling is needed.

- **Cloud SQL (PostgreSQL)**
  - Stores user accounts, user-game associations, and **game state snapshots** (galaxy metadata, star/empire/fleet state)
  - Game snapshots enable recovery after restarts or redeployments (see "Game State Persistence" section)

- **Redis Memorystore** *(Phase 2 — not needed initially)*
  - Required when scaling to multiple Cloud Run instances:
    - `@colyseus/redis-presence` for room discovery across instances
    - `@colyseus/redis-driver` for room state coordination
  - Can also be used for rate limiting and caching once deployed

- **Cloud Storage + Cloud CDN**
  - Serves built React assets
  - Optionally serves other static assets (images, docs)

- **Firebase Authentication** *(recommended — see USER_PLAN.md)*
  - Handles anonymous, email/magic link, and Google auth
  - Server verifies Firebase ID tokens via `firebase-admin` SDK
  - Eliminates need for custom JWT signing/verification

- **Cloud Load Balancing + Cloud Armor**
  - Entry point for HTTPS traffic
  - DDoS protection and IP / WAF rules

## Application-Level Configuration

### Environment Variables (Server)

Define a central config module in the server (example):

```ts
// src/config.ts
export const config = {
  port: parseInt(process.env.PORT || '5111', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost/experiment626',
  redisUrl: process.env.REDIS_URL || '',  // empty until Phase 2

  // Firebase Admin SDK uses GOOGLE_APPLICATION_CREDENTIALS env var
  // or auto-detects on Cloud Run. No secret key needed.
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',

  allowedOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
};
```

Cloud Run will set these via `--set-env-vars` or using Secret Manager references.

### Client Config

A small client-side config module to switch endpoints by environment:

```ts
// experiment626-client/src/config.ts
export const clientConfig = {
  // Single Cloud Run service serves both WS and REST
  gameServerUrl:
    import.meta.env.PROD
      ? 'wss://experiment626-game-server-<region>-<project>.run.app'
      : 'ws://localhost:5111',

  apiBaseUrl:
    import.meta.env.PROD
      ? 'https://experiment626-game-server-<region>-<project>.run.app'
      : 'http://localhost:5111',
};
```

Vite will inject `import.meta.env` for prod vs dev. Note that `gameServerUrl` and
`apiBaseUrl` point to the **same Cloud Run service** — one uses `wss://` for
WebSocket connections, the other `https://` for REST calls.

## Containerization

### Server Dockerfile (Colyseus)

```Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=5111

EXPOSE 5111

CMD ["npm", "start"]
```

### Client Build

- Use `npm run build` in `experiment626-client` to produce static files under `dist/`.
- Upload `dist/` to a Cloud Storage bucket configured for static website hosting + Cloud CDN.

## Cloud Run Deployment (Server)

### Example gcloud Commands

```bash
# Build and push container
cd experiment626-server
gcloud builds submit --tag gcr.io/$PROJECT_ID/experiment626-game-server

# Deploy to Cloud Run (single instance — see scaling notes below)
gcloud run deploy experiment626-game-server \
  --image gcr.io/$PROJECT_ID/experiment626-game-server \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=5111 \
  --min-instances=1 \
  --max-instances=1 \
  --set-env-vars=NODE_ENV=production \
  --set-env-vars=DATABASE_URL=$DATABASE_URL \
  --set-env-vars=FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
```

> **Why `--max-instances=1`?** Colyseus rooms live in the memory of the process
> that created them. If Cloud Run scales to 2+ instances, new connections may
> land on an instance that has no rooms. Multi-instance scaling requires
> `@colyseus/redis-presence` and `@colyseus/redis-driver` (Phase 2).

> Note: For real deployments, use **Secret Manager** instead of inlining secrets.

## Database Architecture

### Core Tables

- `users`: as defined in `USER_PLAN.md` (keyed by Firebase `uid`)
- `user_game_associations`: ties users to galaxies/empires
- `galaxy_snapshots`: periodic snapshots of in-memory game state (see "Game State Persistence")

### Optional / Future Tables

- `user_sessions`: only needed if server-side session tracking is added beyond Firebase ID tokens (see `USER_PLAN.md`)
- `replay_events`: for game replay or analytics

### Access Pattern Considerations

- Colyseus rooms maintain **in-memory game state** for performance.
- DB writes are:
  - On user login/logout
  - On galaxy creation
  - **On every turn boundary** (game state snapshot — see below)
  - On significant game milestones (e.g., game end)
- DB reads are:
  - On dashboard load (user's galaxies)
  - On re-attachment (lookup user's empire in a galaxy)
  - **On room recreation** (restore game state from last snapshot)

## Game State Persistence

### The Problem

Galaxy rooms are **entirely in-memory**. The `Galaxy` class holds `starList`, `empireList`, `fleetList`, `playerViewStateList`, and `starVisibilityMap` as plain `Map` objects. There is currently no `onLeave` handler, and Colyseus disposes rooms by default when all clients disconnect.

For a game designed to run for weeks, this means:
- If the Cloud Run instance restarts (deploy, crash, scaling event), **all game state is lost**.
- If all players disconnect overnight, the room is disposed and the galaxy is gone.

### Solution: Periodic Snapshots + Room Restoration

1. **Set `autoDispose = false`** on `Galaxy` rooms so they survive when all players leave.
2. **Snapshot on every turn boundary.** The `turn()` method already fires on a timer. After each turn, serialize the room state and write it to the `galaxy_snapshots` table.
3. **Snapshot schema** (example):
   ```sql
   CREATE TABLE galaxy_snapshots (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     galaxy_id     TEXT NOT NULL,        -- matches Galaxy room's logical ID
     room_id       TEXT,                 -- Colyseus roomId (may change on restore)
     snapshot_data JSONB NOT NULL,       -- serialized starList, empireList, fleetList, etc.
     turn_number   INTEGER NOT NULL,
     created_at    TIMESTAMPTZ DEFAULT now()
   );
   CREATE INDEX idx_galaxy_snapshots_galaxy_id ON galaxy_snapshots(galaxy_id, created_at DESC);
   ```
4. **On server startup**, query for active galaxies and recreate rooms from the latest snapshot.
5. **Implement `onLeave`** to mark the user's `user_game_association` as inactive but keep the empire alive.

### What Gets Serialized

- `starList` (id, name, owner, x, y, shipCount, factoryCount, wealthProduction)
- `empireList` (id, name, ownerId, wealth, speed, range, battlePower, costs)
- `fleetList` (id, owner, source, destination, ships, startTime, endTime)
- `playerToEmpireList` mapping
- Galaxy config (size, clockTime, turnTime, visibility, etc.)

### What Does NOT Get Serialized

- `playerViewStateList` — regenerated when a player reconnects
- `starVisibilityMap` — regenerated from star ownership + range

## Scaling & Performance

### Cloud Run Scaling

**Phase 1 (initial deployment):**
- `minInstances: 1` — keep one warm instance; avoid cold-start delays for WebSocket connections
- `maxInstances: 1` — **required** because Colyseus rooms are pinned to the process that created them
- `concurrency: ~50-100` — tune based on expected simultaneous players per galaxy
- Room count per process must be tuned based on memory/CPU (each Galaxy with a large star map uses significant memory)

**Phase 2 (multi-instance, when needed):**
- Add `@colyseus/redis-presence` and `@colyseus/redis-driver` (requires Redis Memorystore)
- These allow Colyseus to discover rooms across multiple Cloud Run instances
- Increase `maxInstances` as needed
- Consider sticky sessions or a custom matchmaker to route returning players to the correct instance

### Database Scaling

- Start with a small Cloud SQL instance
- Enable automatic storage increase
- Add read replicas if analytics or heavy reads are needed later

### Session & Cache Scaling

- Firebase ID tokens are stateless — no server-side session store needed initially
- Rate limiting can start with Cloud Armor rules or in-memory counters
- When Redis Memorystore is added (Phase 2), it can also serve:
  - Rate limiting keys
  - Frequently accessed derived data (e.g., galaxy summaries for the lobby)

## Security

### Network & Access

- Use HTTPS everywhere (Cloud Load Balancer / Cloud Run managed certs)
- Restrict Cloud SQL and Redis to VPC and authorized services only
- Use **Cloud IAM** roles for per-service permissions

### Auth & Secrets

- Use **Firebase Authentication** for all user auth (see `USER_PLAN.md`)
  - Server verifies Firebase ID tokens via `firebase-admin` — no custom JWT signing needed
  - Custom auth is documented as a fallback alternative in `USER_PLAN.md` but is not the default path
- Store secrets (e.g., `DATABASE_URL`) in **Secret Manager**
- Firebase Admin SDK authenticates via Cloud Run's service account — no API key needed server-side

### DDoS and Abuse Protection

- Configure **Cloud Armor** policies for:
  - Basic DDoS mitigation
  - Rate-limiting suspicious IPs

## Monitoring & Observability

- Use **Cloud Logging** for all server logs
- Use **Cloud Monitoring** for:
  - Error rates
  - Latency
  - Instance CPU/memory

- Add log fields for:
  - `userId`
  - `galaxyId`
  - `roomId`

This will make debugging user/game-specific issues much easier.

## CI/CD Overview

Use GitHub Actions (or similar) to:

1. Run tests on every push (server + client)
2. Build Docker image for server and push to GCR
3. Deploy to Cloud Run (staging environment)
4. Optionally promote staging → production after manual approval

## Cost-Optimized Deployment (GCE VM Alternative)

The architecture above targets **Cloud Run** as the primary deployment platform. This is the right choice if you want:
- Zero-ops container management
- Automatic HTTPS and managed certificates
- Built-in CI/CD integration
- Future multi-instance scaling (Phase 2)

However, since you've confirmed the game **won't scale beyond one Colyseus instance**, a **Google Compute Engine (GCE) VM** is significantly cheaper and simpler for the near term.

### Cost Comparison (24/7 operation)

| Option | Monthly Cost | Notes |
|---|---|---|
| **Cloud Run** (1 vCPU, 512 MB, always-on) | ~$55-60/month | After free tier |
| **GCE e2-micro** (2 shared vCPU, 1 GB RAM) | **$0/month** | Free tier (1 per billing account) |
| **GCE e2-small** (2 shared vCPU, 2 GB RAM) | ~$13/month | If you exceed free tier limits |
| **GCE e2-medium** (2 shared vCPU, 4 GB RAM) | ~$27/month | For larger games |

Add Cloud SQL (`db-f1-micro` ~$8/month) + Firebase Auth (free) + Cloud Storage/CDN (~$1-2/month):
- **Cloud Run total:** ~$65-70/month
- **GCE e2-micro total:** ~$10/month (or **free** if within limits)
- **GCE e2-small total:** ~$22/month

### GCE VM Deployment Architecture

**Current Implementation (Phase 1 - Single VM):**
```
┌──────────────────────────────────────┐
│         Users (Browser)              │
└──────────────┬───────────────────────┘
               │ HTTP/WebSocket
               │ Port 80
               ▼
┌──────────────────────────────────────┐
│    GCE VM (e2-micro) - Public IP     │
│  ┌────────────────────────────────┐  │
│  │  nginx (port 80)               │  │
│  │  - Serves static client files  │  │
│  │  - Proxies /matchmake to :5111 │  │
│  └────────────┬───────────────────┘  │
│               │                      │
│               ▼                      │
│  ┌────────────────────────────────┐  │
│  │  Node.js + Colyseus (port 5111)│  │
│  │  - Game server via PM2         │  │
│  │  - WebSocket connections       │  │
│  └────────────────────────────────┘  │
│                                      │
│  Client files: /var/www/experiment626│
│  Server code: /opt/experiment626     │
└──────────────────────────────────────┘

**Future (Phase 2 - with persistence):**
Add Cloud SQL (PostgreSQL) for game state persistence
```

### GCE VM Setup Steps

**Automated deployment scripts are available in `/deploy` directory.**

#### Initial Setup (One-time)

1. **Create GCP project and VM** (automated via `deploy/gcp-setup.sh`):
   ```bash
   cd deploy
   ./gcp-setup.sh
   ```
   This creates the VM, enables APIs, and configures firewall rules.

2. **Set up VM environment** (run on VM via `deploy/setup-vm.sh`):
   ```bash
   # SSH into VM
   gcloud compute ssh experiment626-vm --zone=us-central1-a
   
   # Copy and run setup script
   # (or use gcloud compute scp to copy setup-vm.sh first)
   ./setup-vm.sh
   ```
   This installs Node.js 20, nginx, PM2, and creates application directories.

3. **Configure nginx** (one-time):
   ```bash
   # Copy nginx config from local machine
   gcloud compute scp deploy/nginx.conf experiment626-vm:~/ --zone=us-central1-a
   
   # On VM, apply the config
   sudo cp ~/nginx.conf /etc/nginx/sites-available/experiment626
   sudo ln -sf /etc/nginx/sites-available/experiment626 /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Copy deployment script to VM**:
   ```bash
   gcloud compute scp deploy/deploy.sh experiment626-vm:~/ --zone=us-central1-a
   gcloud compute scp deploy/ecosystem.config.js experiment626-vm:~/ --zone=us-central1-a
   ```

#### Deploying Updates

Run the deploy script on the VM (pulls latest code, builds, and deploys):
```bash
# SSH into VM
gcloud compute ssh experiment626-vm --zone=us-central1-a

# Run deployment
~/deploy.sh
```

The deploy script:
- Pulls latest code from GitHub (GCP-infra-impl branch)
- Installs server dependencies and builds server
- Installs client dependencies and builds client
- Deploys client to `/var/www/experiment626/`
- Restarts server via PM2

#### Important Notes

- **Git branch**: Ensure VM is on `GCP-infra-impl` branch (not `main`)
- **Client URL**: Client uses `window.location.origin` to connect to server
- **TypeScript**: Client build skips type checking to avoid unused variable errors
- **PM2 auto-start**: Run `pm2 startup` and `pm2 save` to enable auto-restart on boot
- **Browser cache**: Hard refresh (Cmd+Shift+R) after deployments to clear cached JS

#### Current Deployment

- **Live URL**: `http://34.55.96.153`
- **VM**: `experiment626-vm` in `us-central1-a`
- **Server**: Running on port 5111 via PM2
- **Client**: Static files served by nginx from `/var/www/experiment626/`

### When to Switch from GCE VM to Cloud Run

Consider migrating to Cloud Run when:
- You need to scale beyond one instance (requires Redis + multi-instance setup)
- You want zero-downtime deployments with automatic rollbacks
- You need better integration with Cloud Build / GitHub Actions CI/CD
- VM management (OS updates, security patches) becomes a burden

For a 3-week game with modest player counts, the GCE VM is the pragmatic choice.

---

## Migration Path from Local to GCP

1. **Step 1: DB + Auth + Game Persistence locally**
   - Add local Postgres (via Docker or native install)
   - Integrate Firebase Auth (see `USER_PLAN.md` Phases 0-2)
   - Implement Prisma schema for `users`, `user_game_associations`, `galaxy_snapshots`
   - Implement `autoDispose = false`, `onLeave`, and snapshot/restore logic in `Galaxy.ts`
   - Keep everything running locally

2. **Step 2: Containerize & Run Locally (Docker)**
   - Dockerize server (see Dockerfile above)
   - Docker Compose with Postgres + game server
   - Verify snapshot/restore survives container restart

3. **Step 3: Deploy to GCP Staging (Phase 1)**
   - Single-region Cloud Run (`maxInstances: 1`)
   - Cloud SQL instance (small)
   - Firebase project configured
   - Client deployed to Cloud Storage + CDN
   - Basic monitoring & logging via Cloud Logging

4. **Step 4: Cutover / Dual Environment**
   - Support both local and cloud server URLs in client config (already handled by `clientConfig`)
   - Gradually move real playtests to cloud instance
   - Validate game state persistence across Cloud Run redeployments

5. **Step 5: Harden & Optimize**
   - Improve observability, cost controls, and auto-scaling settings
   - Cloud Armor policies
   - Secret Manager for all sensitive config

6. **Step 6: Multi-Instance Scaling (Phase 2, if needed)**
   - Add Redis Memorystore
   - Integrate `@colyseus/redis-presence` and `@colyseus/redis-driver`
   - Increase `maxInstances` on Cloud Run
   - Implement sticky sessions or custom matchmaker

---

This architecture is intentionally modest and incremental: it mirrors your current local setup while introducing the pieces needed for production (database, auth, game state persistence, and scaling) on GCP. The critical insight is that **Colyseus rooms are single-process**, so Phase 1 is deliberately single-instance. Multi-instance scaling (Phase 2) is a separate effort that requires Redis. As the game and user base grow, we can evolve this plan into multi-region deployments, replay services, and more advanced analytics.
