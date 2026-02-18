# Experiment626 — Codemap

> Auto-generated structural overview of the codebase.
> Last updated: Feb 2026

## Repository Layout

```
experiment626/
├── README.md                    — Quick start, port config, setup checklist
├── USER_PLAN.md                 — User management plan (Firebase-first auth)
├── ARCHITECTURE_PLAN.md         — GCP cloud architecture & deployment strategy
├── CODEMAP.md                   — This file
│
├── experiment626-server/        — Colyseus game server (Node.js / TypeScript)
│   ├── package.json             — Dependencies: colyseus 0.16, express, @colyseus/*
│   ├── ecosystem.config.js      — PM2 config (Colyseus Cloud deployment)
│   ├── Plan.md                  — Original game design notes (stars, empires, fleets, lobby)
│   ├── README.md                — Server-specific readme
│   ├── loadtest/
│   │   └── example.ts           — Colyseus load test scaffold
│   ├── lib/                     — Compiled JS output (gitignored ideally)
│   └── src/
│       ├── index.ts             — Entry point: imports app config, calls listen()
│       ├── app.config.ts        — Server bootstrap: room definitions, Express routes, static files
│       ├── rooms/
│       │   ├── Galaxy.ts        — ★ Main game room (980 lines) — see details below
│       │   ├── Lobby.ts         — Lobby room: game discovery, create/join
│       │   ├── Empire.ts        — Empire wrapper: getters/setters over EmpireState
│       │   ├── Star.ts          — Star wrapper: getters/setters over StarState
│       │   ├── Fleet.ts         — Fleet wrapper: movement, arrival callback
│       │   └── schema/
│       │       ├── GalaxyState.ts      — Colyseus schema: clock, players, galaxy config
│       │       ├── EmpireState.ts      — Colyseus schema: id, name, wealth, speed, range, battlePower
│       │       ├── StarState.ts        — Colyseus schema: position, owner, ships, factories
│       │       ├── FleetState.ts       — Colyseus schema: source, dest, ships, timing
│       │       ├── LobbyState.ts       — Colyseus schema: LobbyPlayer, GalaxySummary, LobbyState
│       │       └── PlayerViewState.ts  — Colyseus schema: per-player visible stars + fleets
│       └── static/
│           └── static-test.html — Test page served by Express static middleware
│
└── experiment626-client/        — Vite + TypeScript + PIXI.js client
    ├── package.json             — Dependencies: colyseus.js, pixi.js
    ├── vite.config.ts           — Dev server on port 3000
    ├── tsconfig.json            — Strict TS, bundler module resolution
    ├── index.html               — Main HTML shell (PIXI canvas, command panel, debug panels)
    ├── public/
    │   ├── index.html           — Alternate/legacy HTML entry
    │   ├── landing.html         — Static HTML lobby (connects to ws://localhost:5111)
    │   ├── vite.svg
    │   └── assets/
    │       ├── star.png         — Star sprite
    │       └── fleet.png        — Fleet sprite
    └── src/
        ├── main.ts              — ★ Client entry point (573 lines) — see details below
        ├── LandingPage.ts       — DOM-based lobby UI (create/join/list games)
        ├── LandingPageReact.tsx  — React-based lobby UI (same features, React version)
        ├── counter.ts           — Vite template leftover (unused)
        ├── style.css            — Styles
        ├── vite-env.d.ts        — Vite type declarations
        ├── typescript.svg       — Vite template leftover
        └── colyseusTypes/       — Auto-generated from server schemas (@colyseus/schema codegen)
            ├── GalaxyState.ts
            ├── EmpireState.ts
            ├── StarState.ts
            ├── FleetState.ts
            ├── LobbyState.ts
            ├── LobbyPlayer.ts
            ├── GalaxySummary.ts
            ├── PlayerViewState.ts
            └── OccupiedSpaceState.ts  — (x, y, type, owner) — not currently used server-side
```

---

## Key Files in Detail

### `experiment626-server/src/app.config.ts`

Bootstraps the Colyseus server via `@colyseus/tools`:

- **Room definitions:**
  - `"game_room"` → `Galaxy`
  - `"lobby"` → `LobbyRoom`
- **Express routes:**
  - `GET /hello_world` — health check
  - `/` — Colyseus Playground (dev only)
  - `/monitor` — Colyseus Monitor (unprotected)
  - `/` — static files from `src/static/`

### `experiment626-server/src/rooms/Galaxy.ts` (980 lines)

The core game room. All game state is **in-memory** (no persistence yet).

**State held as class fields (not in Colyseus schema):**
| Field | Type | Purpose |
|---|---|---|
| `starList` | `Map<string, Star>` | All stars in the galaxy |
| `empireList` | `Map<string, Empire>` | All empires |
| `fleetList` | `Map<string, Fleet>` | Active fleets in transit |
| `playerToEmpireList` | `Map<string, string>` | `client.sessionId` → `empireId` |
| `playerViewStateList` | `Map<string, PlayerViewState>` | Per-player fog-of-war view |
| `starVisibilityMap` | `Map<string, string[]>` | `empireId` → visible star IDs |

**Lifecycle:**
| Method | What it does |
|---|---|
| `onCreate(options)` | Initializes galaxy config, registers message handlers, starts simulation loop |
| `onJoin(client, {empireName})` | Creates empire, maps `sessionId` → `empireId`, sends initial view |
| *(no `onLeave`)* | **Missing** — room auto-disposes when empty |

**Game loop** (`setSimulationInterval`):
1. Advance `clockTime` by `deltaTime`
2. Update fleet positions → trigger `fleetArrive()` on completion
3. Every 1s: send debug info to all clients
4. On turn boundary: run `turn()` (factory production, wealth generation)

**Key methods:**
| Method | Lines | Purpose |
|---|---|---|
| `initGalaxy()` | 227-276 | Generate stars (random or grid), assign home stars |
| `turn()` | 204-226 | Per-turn: factory ship production, empire wealth generation |
| `fleetArrive()` | 624-704 | Resolve fleet arrival: reinforce or battle |
| `sendFleet()` | 725-758 | Validate and dispatch a fleet between stars |
| `genStarVisibilityMap()` | 277-328 | Compute fog-of-war per empire |
| `genPlayerStarView()` | 359-427 | Build per-player star view (owned vs. foreign info) |
| `updatePlayersStarView()` | 428-540 | Incremental view updates (capture, rename, range change, etc.) |
| `buildFactory()` | 760-787 | Build factory on owned star (costs wealth) |
| `upgradeSpeed/Range/BattlePower()` | 788-890 | Empire tech upgrades (costs wealth, exponential scaling) |

**Battle system** (inside `fleetArrive`):
- Compares `attackerShips × (1 + battlePower/10)` vs `defenderShips × (1 + battlePower/10)`
- Upset chance based on force difference (0-40%)
- Defender gets a 2.5% upset bonus
- Randomized outcome variance (±10 ships)

### `experiment626-server/src/rooms/Lobby.ts` (91 lines)

Lightweight lobby room:
- `onCreate`: registers handlers for `list_games`, `create_game`, `join_game`
- `updateGalaxyList()`: polls `matchMaker.query()` every 2s for running `game_room` instances
- `create_game`: calls `matchMaker.createRoom("game_room", options)`, returns `roomId`
- `join_game`: echoes `roomId` back to client for direct join

### `experiment626-client/src/main.ts` (573 lines)

Client entry point. Routing by URL hash:

- **`#lobby` or no hash** → calls `showLandingPage(client)` from `LandingPage.ts`
- **`#game-{roomId}`** → joins room, initializes PIXI.js, starts render loop

**PIXI.js rendering:**
- `createPixiApp()` — initializes PIXI Application, tooltip layer
- `setupCamera()` — mouse wheel zoom (clamped to fit-zoom ↔ 20x), click-drag pan with bounds clamping
- `renderPlayerViewState()` — clears stage, renders star sprites + fleet sprites (interpolated position)
- `renderLoop()` — `requestAnimationFrame` at 60fps, re-renders `playerViewState` each frame
- `displayStarTooltip()` — hover tooltip showing star name, owner, ships, factories, wealth

**Command system:**
- Dropdown selector with typed parameters (e.g., `sendFleet` → `sourceStarId`, `destinationStarId`, `ships`)
- Text input parser (dot-separated: `sendFleet.starA.starB.100`)
- Both send messages to the Colyseus room

---

## Data Flow

```
Client (main.ts)                          Server (Galaxy.ts)
─────────────────                         ──────────────────
joinById(roomId, {empireName})  ────WS──→  onJoin(client, options)
                                           → creates Empire
                                           → maps sessionId → empireId
                                ←──WS────  sends "yourIDs" {Id, empireId}

room.send("init", {method})     ────WS──→  initGalaxy(method)
                                           → generates stars
                                           → assigns home stars
                                ←──WS────  sends "playerViewState" (stars + fleets)

room.send("sendFleet", {...})   ────WS──→  sendFleet(src, dst, ships, clientId)
                                           → validates ownership, range, ship count
                                           → creates Fleet, deducts ships from star

                                           [simulation loop every frame]
                                           → advances clockTime
                                           → moves fleets → fleetArrive() → battle
                                           → turn() → factories produce, wealth accrues
                                ←──WS────  sends "playerViewState" (updated view)
                                ←──WS────  sends "debugInfo" (every 1s)
```

---

## Schema Relationships

```
GalaxyState
├── clockTime, size, config values
└── playerIdList: string[]

EmpireState
├── id, name, ownerId (= client.sessionId, will become Firebase uid)
├── wealth, factoryCost
├── speed, range, battlePower (+ costs)

StarState
├── id, name, owner (= empireId)
├── x, y (galaxy coordinates)
├── wealthProduction, factoryCount, shipCount

FleetState
├── id, owner (= empireId)
├── sourceStarId, destinationStarId
├── ships, startTime, endTime

PlayerViewState
├── sessionId
├── starList: StarState[]    (fog-of-war filtered)
└── fleetList: FleetState[]  (own fleets only)

LobbyState
├── players: Map<sessionId, LobbyPlayer>
└── galaxies: GalaxySummary[]
```

---

## Ports & Endpoints

| Service | Port | URL |
|---|---|---|
| Colyseus server | 5111 | `ws://localhost:5111` (WebSocket) |
| Colyseus Playground | 5111 | `http://localhost:5111` (dev only) |
| Colyseus Monitor | 5111 | `http://localhost:5111/monitor` |
| Static files (server) | 5111 | `http://localhost:5111/{file}` (from `src/static/`) |
| Vite dev server (client) | 3000 | `http://localhost:3000` |

⚠️ **Server port 5111 is hardcoded** in `main.ts` line 25 and `landing.html` line 30.

---

## Known Gaps / Tech Debt

- **No `onLeave` handler** in `Galaxy.ts` — rooms auto-dispose when empty
- **No game state persistence** — all state lost on server restart
- **`client.sessionId` used as player identity** — needs migration to Firebase `uid`
- **`counter.ts`, `typescript.svg`** — Vite template leftovers, can be deleted
- **`OccupiedSpaceState`** — generated but not used server-side
- **`LandingPageReact.tsx`** — React lobby exists but `main.ts` uses `LandingPage.ts` (DOM version)
- **`public/index.html`** — legacy entry point, may conflict with root `index.html`
- **No tests** beyond the loadtest scaffold
- **`lib/` directory** — compiled JS checked in; should be gitignored
