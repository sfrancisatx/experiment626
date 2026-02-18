# User Management System Design & Implementation Plan

## Overview
This document outlines the design and implementation plan for a comprehensive user management system for the Experiment626 galactic conquest game. The system will support multiple authentication methods and persistent user sessions that can re-attach to long-running game sessions.

The core requirement: **players participate in games that last ~3 weeks; when they disconnect, their empire continues, and when they log back in they should re-attach to their existing empire/game state instead of starting over.**

This plan is aligned with `ARCHITECTURE_PLAN.md`, which is the authoritative document for infrastructure and deployment decisions (GCP, Cloud Run, Cloud SQL, Firebase Auth, etc.). This document focuses on the **user management features, data models, and implementation phases**.

## Key Features

### Authentication Methods (via Firebase Authentication)

All authentication is handled by **Firebase Authentication**, which provides:

- **Anonymous / Guest Access**
  - Firebase Anonymous Auth on first visit
  - Generates a Firebase `uid` immediately
  - Can be later upgraded/linked to email or Google

- **Email Link (Magic Link) Sign-In**
  - Passwordless login via Firebase email link
  - Firebase handles sending the email and verifying the link
  - On sign-in, anonymous account can be linked/merged

- **Google Sign-In**
  - Firebase Google provider
  - Access basic profile (name, avatar, email)
  - Can be primary or linked login method

> **Alternative (not primary path):** If we ever need to move off Firebase, we can implement custom auth endpoints (`/api/auth/magic-link/*`, `/api/auth/google/*`) using `jsonwebtoken`, `nodemailer`, and `passport`. This is documented here for reference but is **not the planned approach**.

### User Experience Flow
1. **Landing / Auth Page**
   - Options: Continue as Guest, Login with Email, Login with Google
   - All handled via Firebase client SDK
   - If already logged in (Firebase token in browser): auto-redirect to Dashboard

2. **User Dashboard**
   - Shows **active galaxies/sessions** tied to the user identity
   - Each entry shows:
     - Galaxy name / ID
     - Status (in-progress, finished, scheduled)
     - Last active time
     - Role (which empire)
   - Actions:
     - Rejoin galaxy (re-attach to empire)
     - View history (future)

3. **Game Interface**
   - When user picks a galaxy:
     - Client requests a seat in the corresponding Colyseus room
     - Server resolves which **Empire** belongs to that user in that galaxy
     - Player controls resume with that empire’s state

4. **Session Persistence Behavior**
   - When a user **disconnects**:
     - Their Colyseus client session ends
     - Their **Empire remains active in the galaxy** (ships, production, etc.)
   - When user **reconnects**:
     - Firebase re-authenticates the user (or restores cached token)
     - Galaxy room looks up their existing empire by `userId`
     - New Colyseus session attaches to that empire

## Architecture Design

### Data Models (Core)

#### UserAccount
```ts
interface UserAccount {
  id: string;              // Firebase uid (primary identity)
  email?: string;          // populated when email or Google auth is used
  displayName: string;
  avatarUrl?: string;
  authProvider: 'anonymous' | 'email' | 'google';
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}
```

> **Note:** `id` maps directly to the Firebase `uid`. We maintain a local `users` table for game-specific profile fields and as a stable FK target for `user_game_associations`.

#### UserGameAssociation
Maps a user to a specific galaxy + empire, and supports re-attachment.
```ts
interface UserGameAssociation {
  id: string;
  userId: string;          // FK to UserAccount.id (= Firebase uid)
  galaxyId: string;        // maps to Galaxy room id or logical id
  empireId: string;        // maps to EmpireState.id
  joinedAt: Date;
  lastActiveAt: Date;
  isCurrentlyActive: boolean;
}
```

#### UserSession (Optional / Future)
With Firebase Auth, sessions are managed via Firebase ID tokens (stateless, time-limited, signed by Firebase). A server-side `user_sessions` table is **not required initially** but can be added later for:
- Server-side session revocation
- Multi-device tracking
- Audit trails / login history

```ts
// Optional — only implement if needed
interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
}
```

### Server-Side Components

#### 1. Authentication Middleware
Since Firebase handles all auth flows, the server's responsibility is **token verification only**:

- On every HTTP request and Colyseus connection:
  - Client sends Firebase ID token (in `Authorization: Bearer ...` header or `joinOrCreate` options)
  - Server verifies token using **Firebase Admin SDK** (`admin.auth().verifyIdToken(token)`)
  - Extracts `userId` (Firebase `uid`) from the decoded token

- On first verified connection for a new `uid`:
  - Create or update a `UserAccount` row in the local DB

> **No custom OAuth endpoints, no magic-link token management, no email sending on the server.** Firebase handles all of that.

#### 2. User API
- `GET /api/user/me` – current user profile (from local `users` table)
- `GET /api/user/galaxies` – list `UserGameAssociation` entries for the authenticated user
- `POST /api/user/galaxies` – create association when a new game is started

> **Service split note:** For local dev and early phases, these endpoints live on the same Express app as Colyseus. Per `ARCHITECTURE_PLAN.md`, they may later be split into a separate Cloud Run service (`experiment626-api`).

#### 3. Integration with Colyseus Rooms

**Galaxy Room (`Galaxy.ts`)**
- `onJoin(client, options)` should:
  - Accept Firebase ID token in `options`
  - Verify token via Firebase Admin SDK → extract `userId`
  - Look up existing `UserGameAssociation` for this galaxy + userId
  - If exists: attach to existing `Empire`
  - If not: create new `Empire` and persist association
- On `onLeave`:
  - Mark association `isCurrentlyActive = false` but **do NOT delete empire**
  - Update `lastActiveAt`

**Lobby Room (`Lobby.ts`)**
- When a user creates/joins a galaxy:
  - Also create/update `UserGameAssociation`
  - Provide galaxy list based on authenticated user, not just active rooms

### Database Integration

- **Database**: PostgreSQL (Cloud SQL on GCP, local Postgres or Docker for dev)
- **ORM**: Prisma (recommended) or TypeORM

Core tables:
- `users` — local mirror of Firebase user profiles + game-specific fields
- `user_game_associations` — ties users to galaxies/empires

Optional (future):
- `user_sessions` — only if server-side session tracking is needed
- `galaxies` — persisted galaxy metadata
- `replay_events` — game history / replay data

## Implementation Steps

### Phase 0: Preparation
1. Set up a **Firebase project** in the Google Cloud Console.
2. Enable Firebase Authentication providers: Anonymous, Email Link, Google.
3. Decide on ORM (Prisma recommended) and add it to the server.
4. Add basic database config (local Postgres via Docker or local install).
5. Implement migration scripts for `users` and `user_game_associations`.

### Phase 1: Anonymous Auth + Persistence
1. Add **Firebase client SDK** to the client:
   - On first visit, call `signInAnonymously()` → get a Firebase `uid` + ID token.
   - Store the token; pass it to all server requests and Colyseus connections.
2. Add **Firebase Admin SDK** to the server:
   - Implement middleware: `verifyIdToken(token)` → extract `userId`.
3. On first verified connection, create a `UserAccount` row in Postgres.
4. Update **Galaxy.onJoin** to:
   - Verify token, extract `userId`
   - Store `UserGameAssociation` mapping userId → empireId
5. Update **Lobby** to:
   - Use `userId` (instead of name only) when listing/creating games

### Phase 2: Email Link + Google Sign-In
1. Enable **Email Link sign-in** in Firebase Console.
2. Add email sign-in flow to client UI:
   - User enters email → Firebase sends magic link → user clicks → Firebase authenticates
   - If user was previously anonymous, link accounts using `linkWithCredential()`
3. Enable **Google sign-in** in Firebase Console.
4. Add "Sign in with Google" button to client:
   - Uses Firebase `signInWithPopup()` or `signInWithRedirect()`
   - If user was previously anonymous, link accounts
5. On account linking/upgrade:
   - Update `UserAccount` row (email, displayName, authProvider)
   - `user_game_associations` stay intact (same `userId` / Firebase `uid`)

### Phase 3: Dashboard + Re-Attachment UX
1. Dashboard page listing user's galaxies and status (from `user_game_associations`).
2. "Rejoin" button that passes token + galaxyId to Colyseus → re-attaches to empire.
3. Better error handling for auth failures, expired tokens, etc.
4. Display of current user name/avatar in UI.

### Phase 4: Containerization + Cloud Deployment
*(Detailed in `ARCHITECTURE_PLAN.md`)*
1. Dockerize server.
2. Deploy to GCP Cloud Run (staging).
3. Set up Cloud SQL.
4. Cutover and harden.

## Integration Challenges (Given Current Code)

### 1. Empire–Session Coupling
Currently, `Empire` ownership is keyed by **Colyseus sessionId**, which is transient.

**Required change**: Introduce a persistent `userId` (Firebase `uid`) in `EmpireState` and stop using `sessionId` as the identity key.

### 2. No Database Layer Yet
All state is in-memory inside Colyseus rooms. We need to introduce:
- Postgres connection (local Docker or install; Cloud SQL later)
- Prisma schema + migrations
- A thin repository layer for users and associations

### 3. Client Architecture
Client currently:
- Uses a single `LandingPageReact` for listing/creating/joining games
- Has no routing or authentication context

We need to introduce:
- Firebase SDK initialization + auth state listener
- A minimal router (`react-router-dom`)
- Auth context (user, token, loading states)
- Separation between auth/dashboard/game views

## Dependencies To Add

### Server
- `firebase-admin` — verify Firebase ID tokens
- `prisma` + `@prisma/client` — ORM and database access
- `uuid` — ID generation for game entities

### Client
- `firebase` — Firebase client SDK (auth flows)
- `react-router-dom` — routing between auth/dashboard/game views

## Migration Strategy (High-Level)

1. **Non-breaking introduction of persistence**
   - Add Postgres + Prisma
   - Keep current gameplay working without requiring login
2. **Introduce Firebase anonymous identity**
   - Every visitor gets a `uid` automatically
   - Start persisting galaxy ↔ user mappings
3. **Add optional email/Google login via Firebase**
   - Link/merge anonymous accounts when upgrading
   - `user_game_associations` stay intact
4. **Eventually require authentication** (if desired)
   - Once stable, make login the default path for new players

## Risks and Considerations

- **Real-time + DB latency**: Must avoid per-frame DB calls; keep gameplay logic in-memory and only persist key events (login, galaxy creation, milestones, game end).
- **Schema evolution**: Need migration strategy (Prisma migrations) as game rules expand.
- **Firebase dependency**: We're coupling auth to Firebase. If we ever need to migrate away, we'd need to implement custom auth endpoints (see alternative note above). The `users` table with its own schema gives us a layer of indirection.
- **Account linking edge cases**: Merging anonymous → email → Google accounts needs careful handling to avoid orphaned associations.
- **User experience**: Must not make joining a game feel heavy or enterprise-y; keep flow as light as possible. Anonymous auth should be invisible.

---

This plan is meant to evolve alongside the code. As we implement pieces (Firebase integration, DB layer, client flows), we should update this document with concrete types, endpoints, and diagrams that reflect the actual implementation.
