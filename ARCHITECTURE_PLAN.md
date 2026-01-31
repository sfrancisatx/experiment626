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
│        Cloud Run (API)       │◄────────────┐
│  Auth, user API, REST, etc.  │             │
└──────────────┬───────────────┘             │
               │HTTP                          │
               ▼                              │
┌──────────────────────────────┐             │
│      Cloud Run (Game)        │             │
│  Colyseus server (WS + HTTP) │─────────────┘
└──────────────┬───────────────┘
               │
               │VPC (private)
               ▼
      ┌────────────────┐   ┌──────────────────┐
      │ Cloud SQL (PG) │   │ Redis Memorystore│
      │  Users, assoc  │   │ Sessions/cache   │
      └────────────────┘   └──────────────────┘

      ┌────────────────┐
      │ Cloud Storage  │
      │ Static assets  │
      └────────────────┘
```

### GCP Services Chosen

- **Cloud Run**
  - Runs containerized Node.js services:
    - `experiment626-game-server` (Colyseus)
    - Optional `experiment626-api` (REST auth/user API) if separated from game server
  - Auto-scales based on traffic

- **Cloud SQL (PostgreSQL)**
  - Stores user accounts, sessions, user-game associations, and possibly some persisted game state (e.g., galaxy metadata)

- **Redis Memorystore**
  - Stores short-lived sessions, rate limits, and caches

- **Cloud Storage + Cloud CDN**
  - Serves built React assets
  - Optionally serves other static assets (images, docs)

- **Firebase Authentication (optional but recommended)**
  - Handles email/magic link + Google auth
  - Reduces auth burden on backend

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
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  allowedOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
};
```

Cloud Run will set these via `--set-env-vars` or using Secret Manager references.

### Client Config

A small client-side config module to switch endpoints by environment:

```ts
// experiment626-client/src/config.ts
export const clientConfig = {
  gameServerUrl:
    import.meta.env.PROD
      ? 'wss://experiment626-game-server-<region>-<project>.run.app'
      : 'ws://localhost:5111',

  apiBaseUrl:
    import.meta.env.PROD
      ? 'https://experiment626-api-<region>-<project>.run.app'
      : 'http://localhost:8080',
};
```

Vite will inject `import.meta.env` for prod vs dev.

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

# Deploy to Cloud Run
gcloud run deploy experiment626-game-server \
  --image gcr.io/$PROJECT_ID/experiment626-game-server \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=5111 \
  --set-env-vars=NODE_ENV=production \
  --set-env-vars=DATABASE_URL=$DATABASE_URL \
  --set-env-vars=REDIS_URL=$REDIS_URL
```

> Note: For real deployments, use **Secret Manager** instead of inlining secrets.

## Database Architecture

### Core Tables

- `users`: as defined in `USER_PLAN.md`
- `user_sessions`: tracks active tokens
- `user_game_associations`: ties users to galaxies/empires
- (Later) `galaxies`, `replay_events`, etc.

### Access Pattern Considerations

- Colyseus rooms maintain **in-memory game state** for performance.
- DB writes are:
  - On user login/logout
  - On galaxy creation
  - On significant game milestones (e.g., turn boundaries, game end)
- DB reads are:
  - On dashboard load (user’s galaxies)
  - On re-attachment (lookup user’s empire in a galaxy)

## Scaling & Performance

### Cloud Run Scaling

- Configure:
  - `minInstances: 1` – keep one warm instance for faster first connections
  - `maxInstances: 50-100` – limit to control cost
  - `concurrency: ~50-100` – depends on expected per-instance load

- Colyseus specifics:
  - Room instances per process must be tuned based on memory/CPU
  - If needed, use **matchmaking / room discovery** across multiple instances

### Database Scaling

- Start with a small Cloud SQL instance
- Enable automatic storage increase
- Add read replicas if analytics or heavy reads are needed later

### Session & Cache Scaling

- Use Memorystore (Redis) for:
  - Session tokens (optional if JWTs are fully stateless)
  - Rate limiting keys
  - Frequently accessed derived data

## Security

### Network & Access

- Use HTTPS everywhere (Cloud Load Balancer / Cloud Run managed certs)
- Restrict Cloud SQL and Redis to VPC and authorized services only
- Use **Cloud IAM** roles for per-service permissions

### Auth & Secrets

- Use **Firebase Auth** or carefully implemented custom JWT auth
- Store secrets in **Secret Manager**
- Rotate secrets regularly

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

## Migration Path from Local to GCP

1. **Step 1: DB + Auth locally**
   - Add Postgres
   - Add user management and session tokens
   - Keep everything running locally

2. **Step 2: Containerize & Run Locally (Docker)**
   - Dockerize server
   - Test Docker container locally

3. **Step 3: Deploy to GCP Staging**
   - Single-region Cloud Run
   - Cloud SQL instance
   - Basic monitoring & logging

4. **Step 4: Cutover / Dual Environment**
   - Optionally support both local and cloud server URLs in client config
   - Gradually move real playtests to cloud instance

5. **Step 5: Harden & Optimize**
   - Improve observability, cost controls, and auto-scaling settings

---

This architecture is intentionally modest and incremental: it mirrors your current local setup while introducing the pieces needed for production (database, auth, observability, and scaling) on GCP. As the game and user base grow, we can evolve this plan into multi-region deployments, replay services, and more advanced analytics.
