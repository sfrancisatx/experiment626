import { GalaxyState } from "./colyseusTypes/GalaxyState";
import { Client, Room } from "colyseus.js";
import { showLandingPage } from "./LandingPage";
import { OccupiedSpaceState } from "./colyseusTypes/OccupiedSpaceState";

// HTML elements
const statusEl = document.getElementById("status")!;
const messageInput = document.getElementById("messageInput") as HTMLInputElement;
const sendButton = document.getElementById("sendButton")!;
const messagesList = document.getElementById("messages")!;
const commandSelect = document.getElementById("commandSelect") as HTMLSelectElement;
const commandInputs = document.getElementById("commandInputs") as HTMLDivElement;
const sendCommandButton = document.getElementById("sendCommandButton") as HTMLButtonElement;

// Define the parameter structure for each command
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
  // other commands take no parameters
};

const galaxySize = new Map<string, number>([
  ["itty", 100],
  ["small", 1000],
  ["medium", 10000],
  ["large", 15000]
]);

// 1. Connect to the Colyseus server
let sessionId = "";
let empireId = "";
const client = new Client("ws://localhost:5111");

// Routing: show landing page or game UI based on URL hash
if (!window.location.hash || window.location.hash === "#lobby") {
  showLandingPage(client);
} else if (window.location.hash.startsWith("#game-")) {
  // Extract roomId from hash
  const roomId = window.location.hash.replace("#game-", "");
  const empireName = prompt("Enter your empire name:");
  client.joinById<GalaxyState>(roomId, {empireName}).then((room: Room<GalaxyState>) => {
    console.log("✅ Joined room:", room.roomId);
    statusEl.textContent = `✅ Connected to room: ${room.roomId}`;

    // 3. React to server-side state changes
    room.onStateChange((state) => {
      const mapDisplay = document.getElementById("mapDisplay");
      if (mapDisplay) {
        // Update map display every time mapString changes on server
        mapDisplay.textContent = buildMapString(state.mapBlueprint, galaxySize.get(state.size) || galaxySize.get("itty")!, empireId);
      }
    });

    function buildMapString(mapBlueprint: OccupiedSpaceState[], size: number, playerEmpireId: string): string {
      const grid: string[][] = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => "⬛")
      );
    
      const starMap = new Map<number, OccupiedSpaceState>();
      const fleetSet = new Set<number>();
    
      for (const space of mapBlueprint) {
        const key = space.y * size + space.x;
        if (space.type === "s") {
          starMap.set(key, space); // store entire star object to check ownership
        } else if (space.type === "f") {
          fleetSet.add(key);
        }
      }
    
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const key = y * size + x;
          const hasStar = starMap.has(key);
          const hasFleet = fleetSet.has(key);
    
          if (hasStar && hasFleet) {
            grid[y][x] = "🟥";
          } else if (hasStar) {
            const star = starMap.get(key)!;
            grid[y][x] = star.owner === playerEmpireId ? "🟩" : "🟨";
          } else if (hasFleet) {
            grid[y][x] = "🟦";
          }
        }
      }
    
      return grid.map(row => row.join("")).join("\n");
    }    

    // 5. Handle incoming messages
    room.onMessage("*", (type, data) => {
      console.log(`📨 [${type}]`, data);
      switch (type) {
        case "yourIDs": {
          sessionId = data.Id;
          empireId = data.empireId;
          break;
        }
        default:
          break;
      }
    });

    // 6. Handle keyboard input
    document.addEventListener("keydown", (e) => {
      if (e.key === "p") {
        
      }
    });

    // The Dropdown Selector
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
      const data: Record<string, any> = {};
      inputs.forEach(input => {
        const name = input.name;
        let value: any = input.value;
        if (!isNaN(Number(value))) value = Number(value); // cast number if applicable
        data[name] = value;
      });
    
      room.send(command, data); // assuming `room` is your active Colyseus room
    });

    // 7. Handle UI input for chat/messages
    sendButton.addEventListener("click", () => {
      const instruction = messageInput.value.trim();
      if (instruction) {
        let data: any = {};
        let index = instruction.indexOf(".");
        let instructionName = instruction;
        let other = "";
        if (index !== -1) {
          instructionName = instruction.substring(0, index);
          other = instruction.substring(index + 1);
        }
        switch (instructionName) {
          case "createFleet": {
            let idx1 = other.indexOf(".");
            let sourceStarId = other.substring(0, idx1);
            let rest = other.substring(idx1 + 1);
            let idx2 = rest.indexOf(".");
            let destinationStarId = rest.substring(0, idx2);
            let ships = parseInt(rest.substring(idx2 + 1));
            data = { sourceStarId, destinationStarId, ships };
            break;
          }
          case "renameStar": {
            let idx = other.indexOf(".");
            let id = other.substring(0, idx);
            let name = other.substring(idx + 1);
            data = { id: id, name: name };
            break;
          }
          case "destroyFleet": {
            let id = other;
            data = { id: id };
            break;
          }
          case "init": {
            let generationMethod = other;
            data = { generationMethod: generationMethod };
            break;
          }
          case "listFleets": {
            let verbose = other;
            data = { verbose: verbose };
            break;
          }
          case "listStars": {
            let verbose = other;
            data = { verbose: verbose };
            break;
          }
          case "listEmpires": {
            let verbose = other;
            data = { verbose: verbose };
            break;
          }
          case "sendFleet": {
            let idx1 = other.indexOf(".");
            let sourceStarId = other.substring(0, idx1);
            let other2 = other.substring(idx1 + 1);
            let idx2 = other2.indexOf(".");
            let destinationStarId = other2.substring(0, idx2);
            let ships = parseInt(other2.substring(idx2 + 1));
            data = { sourceStarId: sourceStarId, destinationStarId: destinationStarId, ships: ships };
            break;
          }
          case "buildFactory": {
            let id = other;
            data = { starId: id };
            break;
          }
          case "sendWealth": {
            let idx = other.indexOf(".");
            let amount = parseInt(other.substring(0, idx));
            let targetId = other.substring(idx + 1);
            data = { amount: amount, targetId: targetId };
            break;
          }
          case "listStarsInRange": {
            data = { starId: other };
            break;
          }
          case "addClockTime": {
            let amount = parseInt(other);
            data = { amount: amount };
            break;
          }
          default:
            break;
        }
        console.log(instructionName, data);
        room.send(instructionName, data);
        messageInput.value = "";
      }
    });
    room.onError((err) => {
      console.error("Room error:", err);
    });
    room.onLeave(() => {
      console.log("❌ Left room");
      statusEl.textContent = "❌ Left room.";
    });
  }).catch((err: any) => {
    console.error("❌ Failed to join room:", err);
    statusEl.textContent = "❌ Failed to connect.";
  });
  
}