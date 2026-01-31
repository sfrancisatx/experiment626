# User Management System Design & Implementation Plan

## Overview
This document outlines the design and implementation plan for a comprehensive user management system for the Experiment626 galactic conquest game. The system will support multiple authentication methods and persistent user sessions that can re-attach to long-running game sessions.

## Key Features

### Authentication Methods
1. **Email/Magic Link Authentication** (Optional)
   - Passwordless login via email magic links
   - User enters email, receives login link
   - Click link to authenticate and access account

2. **Google OAuth Authentication** (Optional)
   - Sign in with Google account
   - Seamless integration with Google identity
   - Access basic profile information

3. **Anonymous/Guest Access**
   - Quick play without account creation
   - Can upgrade to full account later

### User Experience Flow
1. **Landing Page** - Authentication options
2. **User Dashboard** - Active galaxies/sessions list
3. **Game Interface** - Main game view when joined to a galaxy

## Architecture Design

### Data Models

#### User Account
```typescript
interface UserAccount {
  id: string;
  email?: string;
  displayName: string;
  avatar?: string;
  authMethod: 'email' | 'google' | 'anonymous';
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}
```

#### User Session
```typescript
interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isActive: boolean;
}
```

#### Game Session Association
```typescript
interface UserGameAssociation {
  userId: string;
  galaxyId: string;
  empireId: string;
  joinedAt: Date;
  lastActiveAt: Date;
  isCurrentlyActive: boolean;
}
```

### Server-Side Components

#### 1. Authentication Service
- Handle magic link generation and validation
- Manage Google OAuth flow
- Session token management
- User account CRUD operations

#### 2. User Management API Endpoints
```
POST /api/auth/magic-link-request
POST /api/auth/magic-link-verify
GET /api/auth/google
POST /api/auth/google/callback
POST /api/auth/logout
GET /api/user/profile
PUT /api/user/profile
GET /api/user/galaxies
POST /api/user/associate-galaxy
```

#### 3. Enhanced Galaxy Room Logic
- Modify `onJoin()` to handle authenticated users
- Implement persistent empire-to-user mapping
- Handle re-attachment logic for returning users
- Maintain empire state when user disconnects

#### 4. Database Integration
- User accounts storage
- Session management
- Game association tracking
- Consider using Redis for session caching

### Client-Side Components

#### 1. Authentication Pages
- Landing page with auth options
- Magic link request form
- Google OAuth integration
- User profile management

#### 2. User Dashboard
- List of active galaxies/sessions
- Game status overview
- Quick join functionality
- Session management

#### 3. Enhanced Game Client
- Authentication state management
- Automatic reconnection logic
- User context awareness

## Implementation Steps

### Phase 1: Foundation & Authentication
1. **Database Setup**
   - Install and configure database (PostgreSQL/MongoDB)
   - Create user account schema
   - Create session management schema
   - Create game association schema

2. **Authentication Service**
   - Implement magic link generation
   - Email service integration (SendGrid/Nodemailer)
   - Token generation and validation
   - Session management

3. **Google OAuth Integration**
   - Set up Google Cloud Console project
   - Implement OAuth flow
   - Profile data extraction
   - Account linking logic

4. **API Endpoints**
   - Create authentication endpoints
   - User profile endpoints
   - Session management endpoints
   - Input validation and error handling

### Phase 2: User Management Integration
1. **Enhanced Galaxy Room**
   - Modify `Galaxy.onJoin()` to accept user authentication
   - Implement user-to-empire mapping
   - Handle re-attachment logic
   - Maintain empire persistence

2. **Session Persistence**
   - Implement "player remains active" logic
   - Handle disconnection vs. logout
   - Automatic reconnection on return
   - Graceful session cleanup

3. **User Dashboard**
   - Create dashboard component
   - Fetch user's active galaxies
   - Display game status
   - Quick join functionality

### Phase 3: Client Implementation
1. **Authentication UI**
   - Landing page redesign
   - Magic link form
   - Google OAuth button
   - Loading states and error handling

2. **State Management**
   - User authentication state
   - Session management
   - Auto-reconnection logic
   - Error boundary handling

3. **Game Integration**
   - Modify game client to use authenticated sessions
   - Handle user context in game
   - Implement reconnection flow
   - Update UI for user awareness

### Phase 4: Testing & Polish
1. **Authentication Testing**
   - Magic link flow testing
   - Google OAuth testing
   - Session persistence testing
   - Error scenario testing

2. **Integration Testing**
   - User-to-empire mapping
   - Re-attachment scenarios
   - Multi-user scenarios
   - Long-running session tests

3. **UI/UX Polish**
   - Loading states
   - Error messages
   - Success feedback
   - Accessibility improvements

## Technical Considerations

### Security
- JWT token management
- Secure magic link generation
- OAuth state parameter validation
- Session timeout handling
- Rate limiting on auth endpoints

### Performance
- Database query optimization
- Session caching with Redis
- Efficient reconnection logic
- Minimal impact on game performance

### Scalability
- Horizontal scaling support
- Session store clustering
- Database connection pooling
- Load balancer considerations

### Error Handling
- Network disconnection handling
- Authentication failure recovery
- Session expiration handling
- Graceful degradation

## Dependencies to Add

### Server Dependencies
```json
{
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "nodemailer": "^6.9.0",
  "passport": "^0.6.0",
  "passport-google-oauth20": "^2.0.0",
  "uuid": "^9.0.0",
  "redis": "^4.6.0"
}
```

### Client Dependencies
```json
{
  "@auth0/auth0-react": "^2.0.0",
  "react-router-dom": "^6.8.0",
  "axios": "^1.3.0"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  auth_method VARCHAR(20) NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### User Game Associations Table
```sql
CREATE TABLE user_game_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  galaxy_id VARCHAR(255) NOT NULL,
  empire_id VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  is_currently_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, galaxy_id)
);
```

## Migration Strategy

### Step 1: Parallel Implementation
- Implement new system alongside existing
- Maintain backward compatibility
- Test with subset of users

### Step 2: Gradual Migration
- Enable authentication for new users
- Allow existing users to migrate
- Monitor system performance

### Step 3: Full Cutover
- Require authentication for all users
- Remove legacy session handling
- Clean up deprecated code

## Success Metrics

### User Engagement
- Account creation rate
- Daily active users
- Session duration
- Return user rate

### Technical Performance
- Authentication success rate
- Session persistence success
- Reconnection success rate
- API response times

### Game Experience
- Reduced player loss due to disconnection
- Improved user retention
- Enhanced multiplayer experience
- Positive user feedback

## Future Enhancements

### Additional Features
- Social login options (Facebook, Apple)
- Two-factor authentication
- User profiles and statistics
- Friend system and invitations
- Clan/guild management

### Advanced Functionality
- Cross-device synchronization
- Offline game state caching
- Push notifications for game events
- Analytics and user behavior tracking

---

## Integration Challenges & Migration Strategy

### Current Architecture Analysis

#### Critical Integration Challenges

**1. Empire-Session Coupling Issue**
- **Problem**: Empire class is tightly coupled to `client.sessionId` via `ownerId` field
- **Impact**: When users disconnect and reconnect, they get new `sessionId`, breaking empire ownership
- **Current Code**: 
  ```typescript
  // Galaxy.ts line 716
  this.empireList.push(new Empire(..., client.sessionId, ...));
  
  // Empire.ts line 26-27
  getOwnerId() {
      return this.state.ownerId; // This is client.sessionId
  }
  ```
- **Solution Required**: Decouple empire ownership from `sessionId` and use persistent user IDs

**2. No Database Layer**
- **Problem**: Server has no database integration - all game state exists only in memory
- **Impact**: User management requires persistent storage for accounts, sessions, and associations
- **Current Setup**: Pure in-memory Colyseus rooms with no persistence layer
- **Solution Required**: Add database integration (PostgreSQL/MongoDB) and ORMs

**3. Client Architecture Limitations**
- **Problem**: Single-page React app with direct Colyseus connection, no routing or auth state management
- **Current Flow**: `main.tsx → LandingPageReact → Direct Colyseus connection`
- **Solution Required**: Implement routing, authentication context, and multiple page components

**4. Lobby Room Limitations**
- **Problem**: LobbyRoom uses simple in-memory state, doesn't track user-game associations
- **Current Code**:
  ```typescript
  // Lobby.ts line 78-82
  onJoin(client: Client, options: any) {
      const player = new LobbyPlayer();
      player.name = options.name || "Guest";
      player.sessionId = client.sessionId;
      // No persistent user tracking
  }
  ```
- **Solution Required**: Enhance lobby to handle authenticated users and persistent game associations

### Required Code Changes

#### Server-Side Modifications

**Galaxy.ts Enhancement**
```typescript
// Current onJoin (line 713-723)
onJoin(client: Client, options: {empireName: string}) {
    this.state.playerIdList.push(client.sessionId);
    // Creates empire tied to sessionId
}

// Needed: User-aware onJoin
onJoin(client: Client, options: {empireName: string, userId?: string, token?: string}) {
    // 1. Authenticate user if token provided
    // 2. Check for existing empire in this galaxy
    // 3. Re-attach or create new empire
    // 4. Update user-game association
}
```

**Empire.ts Enhancement**
```typescript
// Add userId field to EmpireState
export class EmpireState extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") ownerId: string = ""; // Keep for compatibility
    @type("string") userId?: string;     // NEW: Persistent user ID
    // ... other fields
}
```

**New Authentication Middleware**
```typescript
// app.config.ts needs auth middleware
initializeExpress: (app) => {
    // Add authentication routes
    app.use("/api/auth", authRoutes);
    // Add JWT verification middleware
    app.use("/api", verifyToken);
}
```

#### Client-Side Changes

**Routing Structure**
```typescript
// Replace single LandingPageReact with:
// - /login - Authentication page
// - /dashboard - User's active games
// - /game/:id - Game interface
// - /profile - User profile
```

**Authentication Context**
```typescript
// Add auth context for user state management
interface AuthContextType {
    user: User | null;
    login: (email: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}
```

### Database Integration Challenges

**No Existing Database**
- Current setup has zero database dependencies
- Need to:
  1. Choose and install database (PostgreSQL recommended)
  2. Add ORM (Prisma or TypeORM)
  3. Create migration system
  4. Handle connection pooling

**State Synchronization**
- Game state lives entirely in Colyseus rooms
- Need to sync:
  - User accounts ↔ Game sessions
  - Empire ownership ↔ User IDs
  - Game persistence ↔ Database

### Recommended Migration Strategy

#### Phase 0: Foundation (Critical first step)
1. Add database layer without breaking existing functionality
2. Create user tables and basic auth API
3. Implement parallel authentication (optional + existing)

#### Phase 1: Hybrid Mode
1. Allow both authenticated and anonymous play
2. Maintain existing `sessionId` logic for anonymous users
3. Add user ID tracking for authenticated users
4. Implement empire re-attachment for authenticated users

#### Phase 2: Full Migration
1. Make authentication required for new games
2. Migrate existing anonymous accounts
3. Remove legacy `sessionId` dependencies

### Risk Assessment

**High Risk Areas**
- Breaking existing game functionality during migration
- Database performance impact on real-time gameplay
- Session management complexity with Colyseus

**Medium Risk Areas**
- Client-side routing implementation
- OAuth integration complexity
- User experience during transition

**Low Risk Areas**
- UI/UX improvements
- Additional authentication methods
- Analytics and user tracking

### Key Implementation Priority

The biggest challenge will be maintaining real-time game performance while adding the persistent user layer. Recommended starting point:

1. **Database integration** - Foundation for everything else
2. **Basic authentication API** - Core functionality
3. **Empire re-attachment logic** - Key user experience feature
4. **Client-side routing** - User interface enhancement

---

This plan provides a comprehensive roadmap for implementing user management while maintaining the core game experience. The phased approach allows for incremental development and testing, ensuring minimal disruption to the existing game functionality.
