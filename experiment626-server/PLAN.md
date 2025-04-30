# Space Strategy Game Server Architecture

## Core Components

### GalaxyRoomState
- Main state management class for the game room
- Extends Colyseus Schema for real-time synchronization
- Manages three key collections:
  - `stars`: Map of Star objects (MapSchema)
  - `empires`: Map of Empire objects (MapSchema)
  - `players`: Map of Player objects (MapSchema)
- Maintains a `tick` counter for game state updates
- Provides methods for:
  - Galaxy generation (`generateGalaxy`)
  - Collection management (add/remove/get count)
  - Serialization to JSON

### Star
- Represents celestial bodies in the game
- Properties:
  - `id`: Unique identifier
  - `x`, `y`: Position coordinates
  - `size`: Size rating (1-5)
  - `owner`: Player ID who owns the star
  - `resources`: Resource production value
- Methods:
  - `generatePosition`: Randomly assigns position within galaxy bounds
  - `generateAttributes`: Randomly generates size and resources
  - Ownership management

### Empire
- Represents player empires
- Properties:
  - `name`: Empire identifier
  - `shipCount`: Number of ships
  - `shipProductionRate`: Rate of ship production
  - `researchPoints`: Research progress
  - `totalResources`: Resource accumulation
  - `controlledStars`: Array of controlled star IDs

### Player
- Represents game players
- Properties:
  - `name`: Player identifier
  - `score`: Player score
- Methods:
  - Score management (set, increment, decrement)
  - Name management

## Testing Structure

### GalaxyRoomState Tests
- Constructor tests
  - Default values initialization
  - Empty collections verification
- Collection tests
  - Star management (add/remove/count)
  - Empire management (add/remove/count)
  - Player management (add/remove/count)
- Game mechanics
  - Galaxy generation
  - Tick system
- Serialization tests

### Player Tests
- Basic player functionality
- Score system
- Name management
- Serialization

### Star Tests
- Star creation and initialization
- Position generation
- Attribute generation
- Ownership system

## Data Flow

1. Game State Management
   - GalaxyRoomState maintains centralized game state
   - Changes are synchronized through Colyseus Schema

2. Player Actions
   - Players join and create empires
   - Players can claim stars
   - Players interact with game objects

3. Game Mechanics
   - Stars are generated at game start
   - Empires accumulate resources
   - Players compete for control of stars

## Technical Implementation

- Uses Colyseus framework for multiplayer synchronization
- Schema types for real-time data synchronization
- MapSchema for efficient collection management
- TypeScript for type safety and maintainability
- Mocha and Chai for testing framework

## Future Considerations
- Add ship management system
- Implement combat mechanics
- Add resource management
- Implement research system
- Add AI opponents
- Implement chat system
- Add achievement system
