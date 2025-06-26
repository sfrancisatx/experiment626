Game
- Clock: Number
- PlayerIdList: String[]
- 
Galaxy
- 
Stars
- ShipCount
- ShipProduction
- WealthProduction
- Where battles occur, when enemy fleets arrive
Planets?


Empires
- Empires Contain Majority of Data, so that when Players leave, data is safe
- PlayerId: String
- StarsOwned: Star[]
    - Add/Remove Star Methods
- Wealth: Number
- FactoryCost: Fixed cost, doesn't change
- SpeedCost: Fixed cost, doesn't change
- RangeCost: Fixed cost, doesn't change
- BattlePowerCost: Fixed cost, doesn't change
Players

Factory
-Produces 1 Ship every Turn
Turn
-Usually 24 hours, customizable?
-Going to have to scale speeds to turn time
Fleet
- Fleets Contain Ships
- Fleets move, not Ships
- Only exist when sending ships from A to B
- Only can ever be attackers, can't be intercepted
Ships
- Stored in Stars or Fleets
- Expand on Later

Research
Range
- How far your ships can move away from you

---

## Lobby Room (Planned)

The Lobby will be a new room type on the server, responsible for handling player entry and game discovery/creation. Its planned features and requirements:

- **Player Entry:**
  - Players join the lobby with a chosen Player name.

- **Game Discovery:**
  - The lobby maintains and displays a list of all existing games (Galaxies) currently running on the server.

- **Game Creation:**
  - Players can create a new game (Galaxy) from the lobby. This action will instantiate a new Galaxy room and add it to the list of available games.

- **Game Joining:**
  - Players can join an existing game (Galaxy) from the lobby, transferring them from the lobby room to the selected Galaxy room.

- **Lobby State:**
  - List of connected players (with names).
  - List of available games (Galaxy rooms), including their status (e.g., open/in-progress, player count, etc.).

- **Required Interactions:**
  - Join lobby (with name)
  - List games
  - Create game
  - Join game

- **Server Implementation:**
  - Implement a new Lobby room type and schema.
  - Provide methods/events for the above interactions.

- **Client Implementation (future):**
  - UI for entering player name, viewing game list, creating/joining games.

- **Future Features:**
  - Could implement LLM short term memory that has access to recent interactions with a player, and longer-term memory which is the RAG/style context that it operates within the game. 
  - i like the idea of letting a localized LLM generate more interesting names for stars, fleets, empires, etc., but also status messages, battle descriptions, and other updates. 
  - using LLM to interpret free language inputs from teh users like "can you schedule a fleet of 100 ships from A to B at 8?"  etc. ? 
    - the LLM would then have a limited set of instructions to choose from - like "sendFleet" etc. - and would have to interpret which parts of the instruction match to arguments... and perhaps it would offer "this is what i think you want, hit enter to confirm" style interface? 
    
---