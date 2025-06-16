import { GalaxyState } from "./colyseusTypes/GalaxyState";
import { Client, Room } from "colyseus.js";
import { showLandingPage } from "./LandingPage";
import { OccupiedSpaceState } from "./colyseusTypes/OccupiedSpaceState";

// HTML elements
const statusEl = document.getElementById("status")!;
const messageInput = document.getElementById("messageInput") as HTMLInputElement;
const sendButton = document.getElementById("sendButton")!;
const messagesList = document.getElementById("messages")!;
const galaxySize = new Map<string, number>([
  ["small", 1000],
  ["medium", 10000],
  ["large", 15000]
]);

interface occupiedSpace {
    x: number;
    y: number;
    type: string;
}

// 1. Connect to the Colyseus server
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
        mapDisplay.textContent = buildMapString(state.mapBlueprint, galaxySize.get(state.size) || galaxySize.get("small")!);
      }
    });

    function buildMapString(mapBlueprint: OccupiedSpaceState[], size: number): string {
      const grid: string[][] = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => "⬛")
      );
    
      const starSet = new Set<number>();
      const fleetSet = new Set<number>();
    
      for (const space of mapBlueprint) {
        const key = space.y * size + space.x;
        if (space.type === "s") {
          starSet.add(key);
        } else if (space.type === "f") {
          fleetSet.add(key);
        }
      }
    
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const key = y * size + x;
          const hasStar = starSet.has(key);
          const hasFleet = fleetSet.has(key);
    
          if (hasStar && hasFleet) {
            grid[y][x] = "🟥";
          } else if (hasStar) {
            grid[y][x] = "🟨";
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

    });

    // 6. Handle keyboard input
    document.addEventListener("keydown", (e) => {
      if (e.key === "p") {
        room.send("printMap", {});
      }
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
            data = { id, name };
            break;
          }
          case "destroyFleet": {
            let id = other;
            data = { id };
            break;
          }
          case "init": {
            let generationMethod = other;
            data = { generationMethod };
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
  }).catch((err: any) => {
    console.error("❌ Failed to join room:", err);
    statusEl.textContent = "❌ Failed to connect.";
  });
  
}