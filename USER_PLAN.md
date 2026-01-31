# User Management System Design & Implementation Plan

## Overview
This document outlines the design and implementation plan for a comprehensive user management system for the Experiment626 galactic conquest game. The system will support multiple authentication methods and persistent user sessions that can re-attach to long-running game sessions.

The core requirement: **players participate in games that last ~3 weeks; when they disconnect, their empire continues, and when they log back in they should re-attach to their existing empire/game state instead of starting over.**

## Key Features

### Authentication Methods
- **Email/Magic Link Authentication (Optional)**
  - Passwordless login via email magic links
  - User enters email, receives login link
  - Clicking the link authenticates and opens the game

- **Google OAuth Authentication (Optional)**
  - Sign in with Google account
  - Access basic profile (name, avatar, email)
  - Can be primary or linked login method

- **Anonymous/Guest Access**
  - Quick play without full account creation
  - Can be later upgraded/linked to an email/Google account

### User Experience Flow
1. **Landing / Auth Page**
   - Options: Continue as Guest, Login with Email, Login with Google
   - If already logged in: auto-redirect to Dashboard

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
     - Authentication identifies the user
     - Galaxy room looks up their existing empire
     - New Colyseus session attaches to that empire

## Architecture Design

### Data Models (Conceptual)

#### UserAccount
```ts
interface UserAccount {
  id: string;              // persistent user id (UUID)
  email?: string;          // optional for magic link
  googleId?: string;       // optional for Google auth
  displayName: string;
  avatarUrl?: string;
  authMethod: 'email' | 'google' | 'anonymous';
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}
```

#### UserSession
```ts
interface UserSession {
  id: string;              // session id (UUID)
  userId: string;          // FK to UserAccount
  tokenHash: string;       // hashed JWT or opaque token
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
}
```

#### UserGameAssociation
Maps a user to a specific galaxy + empire, and supports re-attachment.
```ts
interface UserGameAssociation {
  id: string;
  userId: string;
  galaxyId: string;        // maps to Galaxy room id or logical id
  empireId: string;        // maps to EmpireState.id
  joinedAt: Date;
  lastActiveAt: Date;
  isCurrentlyActive: boolean;
}
```

### Server-Side Components

#### 1. Authentication Service (HTTP/REST)
- Endpoints (examples):
  - `POST /api/auth/magic-link/request` – submit email, send magic link
  - `POST /api/auth/magic-link/verify` – exchange token for session/JWT
  - `GET /api/auth/google/start` – redirect to Google OAuth
  - `GET /api/auth/google/callback` – Google returns code → issue session
  - `POST /api/auth/logout` – invalidate session
- Responsibilities:
  - Validate email and issue time-limited magic tokens
  - Integrate with email provider (SendGrid, SES, etc.)
  - Integrate with Google OAuth (via Passport or direct libs)
  - Create and manage `UserAccount` records
  - Create and rotate `UserSession` tokens

#### 2. User API
- `GET /api/user/me` – current user profile
- `GET /api/user/galaxies` – list `UserGameAssociation` entries
- `POST /api/user/galaxies` – create association when a new game is started

#### 3. Integration with Colyseus Rooms

**Galaxy Room (`Galaxy.ts`)**
- `onJoin(client, options)` should:
  - Accept `userToken` / `userId` in `options`
  - Validate and resolve to a `UserAccount`
  - Look up existing `UserGameAssociation` for this galaxy
  - If exists: attach to existing `Empire`
  - If not: create new `Empire` and persist association
- On `onLeave`:
  - Mark association `isCurrentlyActive = false` but **do NOT delete empire**
  - Update `lastActiveAt`

**Lobby Room (`Lobby.ts`)**
- When a user creates/joins a galaxy:
  - Also update `UserGameAssociation`
  - Provide galaxy list based on authenticated user, not just active rooms

### Database Integration

Initial recommendation: **PostgreSQL** (Cloud SQL later) with an ORM like Prisma or TypeORM.

Core tables:
- `users`
- `user_sessions`
- `user_game_associations`

(Schema examples are already in the plan, omitted here for brevity.)

## Implementation Steps

### Phase 0: Preparation
1. Decide on ORM (Prisma or TypeORM) and add it to the server.
2. Add basic database config (local Postgres dev instance or Docker).
3. Implement migration scripts for `users`, `user_sessions`, `user_game_associations`.

### Phase 1: Minimal Auth & Persistence
1. Implement **anonymous user** creation on first visit:
   - On first client load, generate a UUID, create a `UserAccount` with `authMethod = 'anonymous'`, and store token in localStorage.
2. Implement **simple session token** (JWT or opaque) and middleware:
   - Every HTTP request and Colyseus connection carries this token.
3. Update **Galaxy.onJoin** to:
   - Take `userId` from token
   - Store mapping to Empire
4. Update **Lobby** to:
   - Use user identity (instead of name only) when listing/creating games

### Phase 2: Email Magic Link Login
1. Add email field to `UserAccount` and unique index.
2. Implement magic link request & verify endpoints.
3. When magic link is used:
   - If anonymous user exists on device, migrate/merge anonymous account into email-based account.
   - Update `user_game_associations` to point to the new `userId`.
4. Update client UI:
   - Add “Login with Email” option on landing/auth page.

### Phase 3: Google OAuth Integration
1. Register app with Google Cloud Console.
2. Implement `/api/auth/google/start` and `/api/auth/google/callback`.
3. On callback:
   - Create or find `UserAccount` by `googleId`.
   - Optionally link to existing account by email.
4. Add “Sign in with Google” button to client.

### Phase 4: Polishing & UX
1. Dashboard page listing user galaxies and status.
2. Better error handling for auth failures, expired links, etc.
3. Display of current user name/avatar in UI.

## Integration Challenges (Given Current Code)

### 1. Empire–Session Coupling
Currently, `Empire` ownership is keyed by **Colyseus sessionId**, which is transient.

```ts
// Galaxy.onJoin
this.empireList.push(
  new Empire(
    new EmpireState(),
    this.idGenerator(),
    options.empireName,
    client.sessionId,  // ← this is transient
    ...
  )
);
```

**Required change**: Introduce a persistent `userId` in `EmpireState` and stop using `sessionId` as the identity key.

### 2. No Database Layer Yet
All state is in-memory inside Colyseus rooms. We need to introduce:
- Postgres connection
- Migration scripts
- A thin repository layer for users and associations

### 3. Client Architecture
Client currently:
- Uses a single `LandingPageReact` for listing/creating/joining games
- Has no routing or authentication context

We need to introduce:
- A minimal router
- Auth context (user, token, loading states)
- Separation between auth/dashboard/game views

## Dependencies To Add (Initial Suggestion)

### Server
- `pg` or `pg-promise` (if using raw SQL)
- OR **Prisma**: `prisma`, `@prisma/client`
- For auth:
  - `jsonwebtoken`
  - `uuid`
  - `nodemailer` (for email magic links)

### Client
- `react-router-dom` for routing
- `axios` or `fetch` wrapper for calling auth/user APIs

## Migration Strategy (High-Level)

1. **Non-breaking introduction of persistence**
   - Add DB + ORM
   - Keep current gameplay working without requiring login
2. **Introduce anonymous identity + token**
   - Start persisting galaxy ↔ user mappings
3. **Add optional email/Google login**
   - Migrate/merge anonymous users
4. **Eventually require authentication** (if desired)
   - Once stable, make login the default path for new players

## Risks and Considerations

- **Real-time + DB latency**: Must avoid per-frame DB calls; keep gameplay logic in-memory and only persist key events.
- **Schema evolution**: Need migration strategy as game rules expand.
- **Security**: Proper token validation, secure magic link tokens, and OAuth state handling.
- **User experience**: Must not make joining a game feel heavy or enterprise-y; keep flow as light as possible.

## GCP-Specific Notes (Long-Term Target)

- **Auth Provider**
  - On GCP we plan to prefer **Firebase Authentication** for email link + Google sign-in instead of fully custom auth flows.
  - The conceptual flows in this document (magic link, Google, anonymous → upgrade) stay the same, but the implementation will:
    - Use Firebase client SDK in the browser for login.
    - Use Firebase Admin SDK on the server to verify ID tokens.

- **User Identity Mapping**
  - `UserAccount.id` will typically map to the Firebase `uid`.
  - We may still keep an internal `users` table for:
    - Game-specific profile fields (display name overrides, preferences, etc.).
    - Stable FK targets for `user_game_associations`.

- **Sessions**
  - When using Firebase ID tokens, the `user_sessions` table becomes optional:
    - Tokens are already time-limited and signed by Firebase.
    - We can add `user_sessions` later if we want server-side session revocation, multi-device tracking, or audit trails.

- **Database Choice**
  - Long-term we will target **Cloud SQL (PostgreSQL)** on GCP.
  - Locally we can run Postgres via Docker or a local install with the same schema and migrations.

- **Token Flow into Colyseus**
  - The browser will obtain an ID token from Firebase and pass it into `joinOrCreate` / `join` options.
  - Colyseus rooms (Lobby/Galaxy) will verify the token server-side and derive `userId` from it.

These GCP-specific details do not change the core user management design; they only influence which concrete services and libraries we use to implement the flows described above.

---

This plan is meant to evolve alongside the code. As we implement pieces (DB layer, auth API or Firebase integration, client flows), we should update this document with concrete types, endpoints, and diagrams that reflect the actual implementation.
