import { GalaxyState } from "./colyseusTypes/GalaxyState";
import { Client, Room } from "colyseus.js";
import { showLandingPage } from "./LandingPage";
import * as PIXI from "pixi.js";

// ===== HTML ELEMENTS =====
const statusEl = document.getElementById("status")!;
const messageInput = document.getElementById("messageInput") as HTMLInputElement;
const sendButton = document.getElementById("sendButton")!;
const commandSelect = document.getElementById("commandSelect") as HTMLSelectElement;
const commandInputs = document.getElementById("commandInputs") as HTMLDivElement;
const sendCommandButton = document.getElementById("sendCommandButton") as HTMLButtonElement;
const debugPanel1 = document.getElementById("debugPanel1")!;
const debugText1 = document.getElementById("debugDisplay1")!;
const debugPanel2 = document.getElementById("debugPanel2")!;
const debugText2 = document.getElementById("debugDisplay2")!;
const debugPanel3 = document.getElementById("debugPanel3")!;
const debugText3 = document.getElementById("debugDisplay3")!;
let showDebug = true;

// ===== COLYSEUS CLIENT =====
const client = new Client("ws://localhost:5111");
let sessionId = "";
let empireId = "";

// ===== GALAXY SIZE MAP =====
const galaxySize = new Map<string, number>([
    ["itty", 100],
    ["small", 1000],
    ["medium", 10000],
    ["large", 15000]
]);

// ===== CAMERA STATE =====
let gridUnitCameraCenterX = 0;
let gridUnitCameraCenterY = 0;
let zoom = 1;

// ===== COMMAND INPUT STRUCTURES =====
const commandParams: Record<string, string[]> = {
    createFleet: ["sourceStarId", "destinationStarId", "ships"],
    renameStar: ["id", "name"],
    destroyFleet: ["id"],
    listFleets: ["verbose"],
    listStars: ["verbose"],
    listEmpires: ["verbose"],
    sendFleet: ["sourceStarId", "destinationStarId", "ships"],
    buildFactory: ["starId"],
    sendWealth: ["amount", "targetId"],
    init: ["generationMethod"],
    listStarsInRange: ["starId"],
    addClockTime: ["amount"]
};

const commandParamTypes: Record<string, Record<string, "string" | "number">> = {
    createFleet: { sourceStarId: "string", destinationStarId: "string", ships: "number" },
    renameStar: { id: "string", name: "string" },
    destroyFleet: { id: "string" },
    listFleets: { verbose: "string" },
    listStars: { verbose: "string" },
    listEmpires: { verbose: "string" },
    sendFleet: { sourceStarId: "string", destinationStarId: "string", ships: "number" },
    buildFactory: { starId: "string" },
    sendWealth: { amount: "number", targetId: "string" },
    init: { generationMethod: "string" },
    listStarsInRange: { starId: "string" },
    addClockTime: { amount: "number" }
};

// ===== MAIN =====
if (!window.location.hash || window.location.hash === "#lobby") {
    showLandingPage(client);
} else if (window.location.hash.startsWith("#game-")) {
    const roomId = window.location.hash.replace("#game-", "");
    const empireName = prompt("Enter your empire name:");
    let pixiInitialized = false;
    client.joinById<GalaxyState>(roomId, { empireName }).then(async (room: Room<GalaxyState>) => {
        console.log("✅ Joined room:", room.roomId);
        statusEl.textContent = `✅ Connected to room: ${room.roomId}`;

        const mapDisplay = document.getElementById("mapDisplay");
        if (!mapDisplay) return;

        let pixiApp: PIXI.Application | null = null;
        let galaxyUnits = galaxySize.get(room.state.size) || 100;

        room.onStateChange(async (state: GalaxyState) => {
            if (!pixiInitialized) {
                pixiInitialized = true;
                gridUnitCameraCenterX = galaxyUnits / 2;
                gridUnitCameraCenterY = galaxyUnits / 2;

                await PIXI.Assets.load([
                  "assets/star.png",
                  "assets/fleet.png"
                ]);

                pixiApp = await createPixiApp(mapDisplay);
                setupCameraControls(pixiApp, galaxyUnits);
            }
            renderGalaxyState(state, pixiApp!, galaxyUnits);
        });

        room.onMessage("*", (type, message) => {
            console.log(`\nMessage Received: [${type}]`, message);
            if (type === "yourIDs") {
                sessionId = message.Id;
                empireId = message.empireId;
            }
        });

        room.onMessage("debugInfo", (data) => {
            //console.log(`\nDebug Info Received:`, data);
            updateDebugUI(data.content1, data.content2, data.content3);
        });

        room.onError((err) => console.error("Room Error:", err));
        room.onLeave(() => {
            console.log("❌ Left room");
            statusEl.textContent = "❌ Left room.";
        });

        // ====== COMMAND SELECTOR ======
        commandSelect.addEventListener("change", () => {
            const selected = commandSelect.value;
            commandInputs.innerHTML = "";
            const params = commandParams[selected] || [];
            for (const param of params) {
                const input = document.createElement("input");
                input.type = "text";
                input.placeholder = param;
                input.name = param;
                commandInputs.appendChild(input);
            }
        });

        sendCommandButton.addEventListener("click", () => {
            const command = commandSelect.value;
            if (!command) return;

            const inputs = commandInputs.querySelectorAll("input");
            const paramTypes = commandParamTypes[command] || {};
            const data: Record<string, any> = {};

            inputs.forEach((input: HTMLInputElement) => {
                const name = input.name;
                const value = input.value;
                const expectedType = paramTypes[name] || "string";
                data[name] = expectedType === "number" ? Number(value) : value;
            });

            console.log(`\nCommand Sent (Dropdown): [${command}]`, data);
            room.send(command, data);
        });

        sendButton.addEventListener("click", () => {
            const instruction = messageInput.value.trim();
            if (!instruction) return;

            let data: any = {};
            let instructionName = instruction;
            let other = "";

            const dotIndex = instruction.indexOf(".");
            if (dotIndex !== -1) {
                instructionName = instruction.substring(0, dotIndex);
                other = instruction.substring(dotIndex + 1);
            }

            try {
                switch (instructionName) {
                    case "createFleet": {
                        const [sourceStarId, destinationStarId, ships] = other.split(".");
                        data = { sourceStarId, destinationStarId, ships: parseInt(ships) };
                        break;
                    }
                    case "renameStar": {
                        const [id, name] = other.split(".");
                        data = { id, name };
                        break;
                    }
                    case "destroyFleet":
                    case "buildFactory":
                    case "listStarsInRange": {
                        data = { id: other, starId: other };
                        break;
                    }
                    case "init": {
                        data = { generationMethod: other };
                        break;
                    }
                    case "listFleets":
                    case "listStars":
                    case "listEmpires": {
                        data = { verbose: other };
                        break;
                    }
                    case "sendFleet": {
                        const [sourceStarId, destinationStarId, ships] = other.split(".");
                        data = { sourceStarId, destinationStarId, ships: parseInt(ships) };
                        break;
                    }
                    case "sendWealth": {
                        const [amount, targetId] = other.split(".");
                        data = { amount: parseInt(amount), targetId };
                        break;
                    }
                    case "addClockTime": {
                        data = { amount: parseInt(other) };
                        break;
                    }
                    default: {
                        console.warn("Unknown command:", instructionName);
                        break;
                    }
                }
                console.log(`\nCommand Sent (Textbox): [${instructionName}]`, data);
                room.send(instructionName, data);
                messageInput.value = "";
            } catch (err) {
                console.error("Error parsing command:", err);
            }
        });
    }).catch((err) => {
        console.error("❌ Failed to join room:", err);
        statusEl.textContent = "❌ Failed to connect.";
    });
}

// ===== PIXI UTILITIES =====
async function createPixiApp(container: HTMLElement): Promise<PIXI.Application> {
    container.innerHTML = ""; // inside createPixiApp
    const app = new PIXI.Application();
    await app.init({
        width: 900,
        height: 800,
        backgroundColor: 0x181828,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    });
    container.appendChild(app.canvas);
    return app;
}

function setupCameraControls(app: PIXI.Application, galaxySize: number) {
    const viewWidth = app.renderer.width;
    const viewHeight = app.renderer.height;
    let dragging = false;
    let lastMouse = { x: 0, y: 0 };
    let pendingPan = { dx: 0, dy: 0 };
    let grabWorld = { x: 0, y: 0 };

    app.view.addEventListener("wheel", (e) => {
      e.preventDefault();
        
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const unitsVisibleX = galaxySize / zoom;
      const unitsVisibleY = galaxySize / zoom;
      const minX = gridUnitCameraCenterX - unitsVisibleX / 2;
      const minY = gridUnitCameraCenterY - unitsVisibleY / 2;

      // World coords under cursor before zoom
      const worldXBefore = minX + (mouseX / viewWidth) * unitsVisibleX;
      const worldYBefore = minY + (mouseY / viewHeight) * unitsVisibleY;

      // Apply zoom
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom *= zoomFactor;
      zoom = Math.max(1, Math.min(10, zoom));

      // Units visible after zoom
      const newUnitsVisibleX = galaxySize / zoom;
      const newUnitsVisibleY = galaxySize / zoom;
      const newMinX = gridUnitCameraCenterX - newUnitsVisibleX / 2;
      const newMinY = gridUnitCameraCenterY - newUnitsVisibleY / 2;

      // World coords under cursor after zoom
      const worldXAfter = newMinX + (mouseX / viewWidth) * newUnitsVisibleX;
      const worldYAfter = newMinY + (mouseY / viewHeight) * newUnitsVisibleY;

      // Adjust camera to keep point under cursor fixed
      gridUnitCameraCenterX += (worldXBefore - worldXAfter);
      gridUnitCameraCenterY += (worldYBefore - worldYAfter);
    });

    app.view.addEventListener("mousedown", (e) => {
        dragging = true;
        const rect = app.view.getBoundingClientRect();
        lastMouse.x = e.clientX - rect.left;
        lastMouse.y = e.clientY - rect.top;

        const unitsVisibleX = galaxySize / zoom;
        const unitsVisibleY = galaxySize / zoom;
        const minX = gridUnitCameraCenterX - unitsVisibleX / 2;
        const minY = gridUnitCameraCenterY - unitsVisibleY / 2;

        grabWorld.x = minX + (lastMouse.x / app.renderer.width) * unitsVisibleX;
        grabWorld.y = minY + (lastMouse.y / app.renderer.height) * unitsVisibleY;
    });
    app.view.addEventListener("mouseup", () => dragging = false);
    app.view.addEventListener("mouseleave", () => dragging = false);
    app.view.addEventListener("mousemove", (e) => {
        if (dragging) {
          const rect = app.view.getBoundingClientRect();
          const currentMouseX = e.clientX - rect.left;
          const currentMouseY = e.clientY - rect.top;
  
          const unitsVisibleX = galaxySize / zoom;
          const unitsVisibleY = galaxySize / zoom;
          const minX = gridUnitCameraCenterX - unitsVisibleX / 2;
          const minY = gridUnitCameraCenterY - unitsVisibleY / 2;
  
          const currentWorldX = minX + (currentMouseX / app.renderer.width) * unitsVisibleX;
          const currentWorldY = minY + (currentMouseY / app.renderer.height) * unitsVisibleY;
  
          const deltaX = grabWorld.x - currentWorldX;
          const deltaY = grabWorld.y - currentWorldY;
  
          pendingPan.dx += deltaX;
          pendingPan.dy += deltaY; 
        }
    });
    app.ticker.add(() => {
        if (pendingPan.dx !== 0 || pendingPan.dy !== 0) {
            gridUnitCameraCenterX += pendingPan.dx;
            gridUnitCameraCenterY += pendingPan.dy;
            pendingPan.dx = 0;
            pendingPan.dy = 0;
        }
    });
}

function renderGalaxyState(state: GalaxyState, app: PIXI.Application | null, galaxySize: number) {
  if (!app) return;
  const stage = app.stage;
    stage.removeChildren();
    if (zoom < 1) {
        console.log("Zoom is less than 1; Invalid value");
        zoom = 1;
    }
    if (gridUnitCameraCenterX < 0 || gridUnitCameraCenterY < 0 || gridUnitCameraCenterX > galaxySize || gridUnitCameraCenterY > galaxySize) {
        console.log(`Camera is out of bounds: X: ${gridUnitCameraCenterX}, Y: ${gridUnitCameraCenterY}\nGalaxy Size: ${galaxySize}`);
        return;
    }
    const viewWidth = app.renderer.width;
    const viewHeight = app.renderer.height;
    const unitsVisibleX = galaxySize / zoom;
    const unitsVisibleY = galaxySize / zoom;
    const halfUnitsVisibleX = unitsVisibleX / 2;
    const halfUnitsVisibleY = unitsVisibleY / 2;
    if (gridUnitCameraCenterX - halfUnitsVisibleX < 0) {
        gridUnitCameraCenterX = halfUnitsVisibleX;
    }
    if (gridUnitCameraCenterY - halfUnitsVisibleY < 0) {
        gridUnitCameraCenterY = halfUnitsVisibleY;
    }
    if (gridUnitCameraCenterX + halfUnitsVisibleX > galaxySize) {
        gridUnitCameraCenterX = galaxySize - halfUnitsVisibleX;
    }
    if (gridUnitCameraCenterY + halfUnitsVisibleY > galaxySize) {
        gridUnitCameraCenterY = galaxySize - halfUnitsVisibleY;
    }
    const pixelsPerUnitX = viewWidth / unitsVisibleX;
    const pixelsPerUnitY = viewHeight / unitsVisibleY;
    const minX = gridUnitCameraCenterX - halfUnitsVisibleX;
    const maxX = gridUnitCameraCenterX + halfUnitsVisibleX;
    const minY = gridUnitCameraCenterY - halfUnitsVisibleY;
    const maxY = gridUnitCameraCenterY + halfUnitsVisibleY;

    for (const space of state.mapBlueprint) {
        if (space.x >= minX && space.x <= maxX && space.y >= minY && space.y <= maxY) {
        const screenX = (space.x - minX) * pixelsPerUnitX;
        const screenY = (space.y - minY) * pixelsPerUnitY;
        let sprite;
        if (space.type === "s") {
            sprite = PIXI.Sprite.from('assets/star.png');
        } else if (space.type === "f") {
            sprite = PIXI.Sprite.from('assets/fleet.png');
        }
        if (!sprite) {
          console.error ('Sprite is undefined\nspace.type = ' + space.type);
          return;
        }
        sprite.width = 10 * zoom;
        sprite.height = 10 * zoom;
        sprite.anchor.set(0.5);
        sprite.x = screenX;
        sprite.y = screenY;
        stage.addChild(sprite);
        }
    }
}

// ===== DEBUG UI =====
function updateDebugUI(panel1: string, panel2: string, panel3: string) {
    if (showDebug) {
        debugPanel1.style.display = "block";
        debugText1.textContent = panel1;
        debugPanel2.style.display = "block";
        debugText2.textContent = panel2;
        debugPanel3.style.display = "block";
        debugText3.textContent = panel3;
    } else {
        debugPanel1.style.display = "none";
        debugPanel2.style.display = "none";
        debugPanel3.style.display = "none";
    }
}
