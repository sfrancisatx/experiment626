# Space Strategy Game Server Architecture

## Core Components

### Galaxy
- Represents the game world
- Properties (to be pased on to the galaxystate):
  - `timeCompression`: compression factor for game speed
  - productionCadence`: how often (in ticks) resources are produced - by default, one day (24 hours)
  - `numStars`: number of stars to generate
  - `empireCount`: number of empires to generate
  - `galaxyDefaults`: default values for galaxy generation, which include:
    - `duration`: duration of the game in ticks, or alternately, start and end times (and let the game compute the ticks)
    - `factoryCost`: cost of a factory
    - `speedCost`: cost of a speed upgrade
    - `rangeCost`: cost of a range upgrade
    - `battlePowerCost`: cost of a battle power upgrade for ships

### GalaxyRoomState
- Main state management class for the game room
- Extends Colyseus Schema for real-time synchronization
- Manages three key collections:
  - `stars`: Map of Star objects (MapSchema)
  - `empires`: Map of Empire objects (MapSchema)
  - `players`: Map of Player objects (MapSchema)
- Maintains a `tick` counter for game state updates
- 'timeCompression' property for game speed
- Provides methods for:
  - Galaxy generation (`generateGalaxy`)
  - Collection management (add/remove/get count)
  - Serialization to JSON
  - generating a map of stars with random positions and attributes
  - assigning a random "first star" to each empire. This star will be the empire's home star. The empire will start with 10 ships on this star. These first stars should be distributed evenly across the galaxy.

### Star
- Represents celestial bodies in the game
- Properties:
  - `id`: Unique identifier
  - `x`, `y`: Position coordinates
  - `size`: Size rating (1-5)
  - `owner`: Player ID who owns the star
  - `wealth`: Resource production value
  - `numShips`: Number of ships on the star
  - `isDead`: Boolean indicating if the star is dead  
  - `empireID`: ID of the empire that controls the star
- Methods:
  - `generatePosition`: Randomly assigns position within galaxy bounds
  - `generateAttributes`: Randomly generates size and resources
  - Ownership management

### Empire
- Represents player empires
- Properties:
  - `name`: Empire identifier
  - `color`: Color of the empire
  - `shipCount`: Number of ships
  - `shipProductionRate`: Rate of ship production
  - `researchPoints`: Research progress
  - `totalResources`: Resource accumulation
  - `controlledStars`: Array of controlled star IDs
  - `homeStar`: A reference to the home star ID

### Fleet  
- Represents a fleet of ships, and a routing from one star to another
- Properties:
  - `galaxyState`: Reference to the parent GalaxyRoomState instance
  - `id`: Unique identifier
  - `owner`: Empire ID who owns the fleet
  - `ships`: Number of ships
  - `speed`: Speed of the fleet
  - `range`: Range of the fleet
  - `startingPoint`: Starting star ID
  - `endPoint`: Destination star ID
  - `x`: x position of the fleet
  - `y`: y position of the fleet
  - `eta`: Estimated time of arrival  
  - `isGarrisoned`: Boolean indicating if the fleet is garrisoned 
- Methods: 
  - `updatePosition`: Updates the fleet's position based on speed and direction
  - `updateETA`: Updates the fleet's estimated time of arrival
  - `getDestination`: Retrieves the destination star object from the game state
- Implementation Notes:
  - The `getDestination` method should be implemented in the Galaxy class since it needs access to the game state
  - The fleet should have a reference to its parent Galaxy instance to access the stars collection
  - Position updates use trigonometry to calculate movement based on speed and direction
  - ETA calculations are based on remaining distance and current speed

### Player
- Represents game players
- Properties:
  - `id`: Player identifier
  - `name`: Player name
  - `score`: Player score
  - `empire`: Empire ID that the player controls
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
### Galaxy Tests
- Galaxy generation
- Tick system
- Serialization tests

### Fleet Tests
- Fleet creation and initialization
- Position updates and movement
- ETA calculations
- Garrisoning system
- Serialization

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

- Add ship management system
- Implement combat mechanics
- Add resource management
- Implement research system
- Add AI opponents
- Implement chat system
- Add achievement system
