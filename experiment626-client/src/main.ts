import { GalaxyState } from "./colyseusTypes/GalaxyState";
import { Client, Room } from "colyseus.js";
import { showLandingPage } from "./LandingPage";
import * as PIXI from "pixi.js";
import type { PlayerViewState } from "colyseusTypes/PlayerViewState";

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
let playerViewState: PlayerViewState | null = null;
let galaxyState: GalaxyState | null = null;
let pixiApp: PIXI.Application | null = null;
let galaxyUnits = 1;

// ===== GALAXY SIZE MAP =====
const galaxySize = new Map<string, number>([
    ["itty", 100],
    ["small", 1000],
    ["medium", 10000],
    ["large", 15000]
]);

// ===== CAMERA STATE =====
let zoom = 1;
let fitZoom = 1;

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
    upgradeSpeed: [],
    upgradeRange: [],
    upgradeBattlePower: [],
    sendWealth: ["amount", "targetId"],
    init: ["generationMethod"],
    listStarsInRange: ["starId"],
    addClockTime: ["amount"],
    listStarVisibilityMap: [],
    listPlayersStarView: [],
    listPlayersFleetView: []
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
    upgradeSpeed: {},
    upgradeRange: {},
    upgradeBattlePower: {},
    sendWealth: { amount: "number", targetId: "string" },
    init: { generationMethod: "string" },
    listStarsInRange: { starId: "string" },
    addClockTime: { amount: "number" },
    listStarVisibilityMap: {},
    listPlayersStarView: {},
    listPlayersFleetView: {}
};
// ===== POPULATE COMMAND DROPDOWN =====
const commands = Object.keys(commandParams).sort();
for (const command of commands) {
    const option = document.createElement("option");
    option.value = command;
    option.textContent = command;
    commandSelect.appendChild(option);
}
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

        galaxyUnits = galaxySize.get(room.state.size) || 100;

        room.onStateChange(async (state: GalaxyState) => {
            galaxyUnits = galaxySize.get(state.size) || 100;
            galaxyState = state;
        
            if (!pixiInitialized) {
                pixiInitialized = true;
                await PIXI.Assets.load([
                    "assets/star.png",
                    "assets/fleet.png"
                ]);
        
                pixiApp = await createPixiApp(mapDisplay);
                setupCamera(pixiApp);
        
                // 🟢 Start the continuous render loop now that PIXI is ready
                renderLoop();
            }
        });
        

        room.onMessage("*", (type, message) => {
            if (type != "debugInfo" && type != "playerViewState") {
                console.log(`\nMessage Received: [${type}]`, message);
            }
            if (type === "yourIDs") {
                sessionId = message.Id;
                empireId = message.empireId;
            }
            if (type === "playerViewState") {
                playerViewState = message;
            }
            if (type === "debugInfo") {
                updateDebugUI(message.content1, message.content2, message.content3);
            }
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
/*
PIXI JS Plan
So Pixi JS has its own coordinate plane, that it already knows how to zoom, and how to pan on.
The view is defined from the top left corner with position.x and y. 
The end points to the right and going down is equal to
the renderer.width (or height) divided by stage.scale.
No more need for galaxy units to Pixels, PIXI JS already does this stuff for us,
as in it does the zooming and the rendering/derending during camera movement
so we don't need to figure out which galaxy units it can see,
we just treat its coordinate plane as though it is the galaxy units coordinate plane.
We put all the stars at sprite.x = star.x, easy as that.
Then we set the default/minimum zoom to the amount that would make
the camera see exactly all the galaxy units and no more
Then we have a max zoom in of course, but that is fixed, irrelevant of how big the galaxy is.
When we PAN, while we have to still update camera positions,
PIXI JS will do all the rendering/unrendering for the stars that are coming and leaving.
When Zooming we still need it to track your mouse,
so we will first do the actual stage.scale change next value calculation
and then knowing the way PIXI JS calculates how much is in view,
we can do that calculation, renderer.width over stage.scale,
then take half that and subtract it from the current mouse position
for that to be the new stage.position.x / y.
For Zooming Out, you want to add guardrails that lock the new camera width
to the Galaxy Size of course. But keeping it as close as possible to the original point.
Panning is much of the same though still, because we just track the mouse,
then track the delta change from where they clicked and are dragging to where the mouse is now,
and we apply that change,
capped out at the maximum amount that won't push any of the camera view out of bounds for the GalaxySize.
*/
async function createPixiApp(container: HTMLElement): Promise<PIXI.Application> {
    container.innerHTML = ""; // inside createPixiApp
    const app = new PIXI.Application();
    await app.init({
        width: 800,
        height: 800,
        backgroundColor: 0x181828,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    });
    container.appendChild(app.canvas);
    return app;
}

function setupCamera(app: PIXI.Application) {
    // Set initial fitZoom to fit entire galaxy
    const fitZoomX = app.renderer.width / galaxyUnits;
    const fitZoomY = app.renderer.height / galaxyUnits;
    fitZoom = Math.min(fitZoomX, fitZoomY);
    zoom = fitZoom;
    app.stage.scale.set(zoom);

    // Set Stage View Top Left Corner to 0,0, its width should be app.renderer.width / app.stage.scale
    app.stage.position.x = 0;
    app.stage.position.y = 0;

    app.view.addEventListener("wheel", (e) => {
        e.preventDefault();
        const rect = app.view.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // World coordinates under mouse
        const worldX = (mouseX - app.stage.position.x) / app.stage.scale.x;
        const worldY = (mouseY - app.stage.position.y) / app.stage.scale.y;

        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        let newZoom = zoom * scaleFactor;
        newZoom = Math.max(fitZoom, Math.min(20, newZoom));

        // Keep world point under mouse stationary
        app.stage.position.x -= (worldX * newZoom - worldX * zoom);
        app.stage.position.y -= (worldY * newZoom - worldY * zoom);
        zoom = newZoom;
        app.stage.scale.set(zoom);

        // Clamp stage position so galaxy never moves out of bounds
        const viewWidth = app.renderer.width;
        const viewHeight = app.renderer.height;
        const scaledGalaxyWidth = galaxyUnits * zoom;
        const scaledGalaxyHeight = galaxyUnits * zoom;
        let minX, maxX, minY, maxY;
        if (scaledGalaxyWidth > viewWidth) {
            minX = viewWidth - scaledGalaxyWidth;
            maxX = 0;
        } else {
            minX = maxX = (viewWidth - scaledGalaxyWidth) / 2;
        }
        if (scaledGalaxyHeight > viewHeight) {
            minY = viewHeight - scaledGalaxyHeight;
            maxY = 0;
        } else {
            minY = maxY = (viewHeight - scaledGalaxyHeight) / 2;
        }
        app.stage.position.x = Math.min(maxX, Math.max(minX, app.stage.position.x));
        app.stage.position.y = Math.min(maxY, Math.max(minY, app.stage.position.y));
    });

    let dragging = false;
    let lastX = 0, lastY = 0;
    app.view.addEventListener("mousedown", (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });
    app.view.addEventListener("mouseup", () => dragging = false);
    app.view.addEventListener("mouseleave", () => dragging = false);
    app.view.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        if (zoom === fitZoom) return; // disable panning when fully zoomed out
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        const viewWidth = app.renderer.width;
        const viewHeight = app.renderer.height;
        const scaledGalaxyWidth = galaxyUnits * zoom;
        const scaledGalaxyHeight = galaxyUnits * zoom;
        let minX, maxX, minY, maxY;
        if (scaledGalaxyWidth > viewWidth) {
            minX = viewWidth - scaledGalaxyWidth;
            maxX = 0;
        } else {
            minX = maxX = (viewWidth - scaledGalaxyWidth) / 2;
        }
        if (scaledGalaxyHeight > viewHeight) {
            minY = viewHeight - scaledGalaxyHeight;
            maxY = 0;
        } else {
            minY = maxY = (viewHeight - scaledGalaxyHeight) / 2;
        }
        app.stage.position.x = Math.min(maxX, Math.max(minX, app.stage.position.x + dx));
        app.stage.position.y = Math.min(maxY, Math.max(minY, app.stage.position.y + dy));
    });
}


function renderPlayerViewState(galaxyState: GalaxyState, viewState: PlayerViewState, app: PIXI.Application | null, galaxySize: number) {
    if (!app) return;
    const stage = app.stage;
    stage.removeChildren();

    // Place stars at galaxy coordinates directly
    viewState.starList.forEach(star => {
        const sprite = PIXI.Sprite.from('assets/star.png');
        sprite.width = 2; // fixed size in galaxy units
        sprite.height = 2;
        sprite.anchor.set(0.5);
        sprite.x = star.x;
        sprite.y = star.y;
        stage.addChild(sprite);
    });

    // Draw Fleets with smooth interpolation
    viewState.fleetList.forEach(fleet => {
        const sourceStar = viewState.starList.find(s => s.id === fleet.sourceStarId);
        const destinationStar = viewState.starList.find(s => s.id === fleet.destinationStarId);
        if (!sourceStar || !destinationStar) return;

        const percentDone = (galaxyState.clockTime - fleet.startTime) / (fleet.endTime - fleet.startTime);
        const clampedPercent = Math.max(0, Math.min(1, percentDone));

        const fleetX = sourceStar.x + (destinationStar.x - sourceStar.x) * clampedPercent;
        const fleetY = sourceStar.y + (destinationStar.y - sourceStar.y) * clampedPercent;

        const sprite = PIXI.Sprite.from('assets/fleet.png');
        sprite.width = 2;
        sprite.height = 2;
        sprite.anchor.set(0.5);
        sprite.x = fleetX;
        sprite.y = fleetY;
        stage.addChild(sprite);
    });
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
function renderLoop() {
    if (pixiApp && playerViewState && galaxyState) {
        renderPlayerViewState(galaxyState, playerViewState, pixiApp, galaxyUnits);
    }
    requestAnimationFrame(renderLoop); // 🟢 Calls itself repeatedly, 60fps
}
