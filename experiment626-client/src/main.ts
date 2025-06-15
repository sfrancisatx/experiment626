import { GalaxyState } from "./colyseusTypes/GalaxyState";
import { Client, Room } from "colyseus.js";
import { showLandingPage } from "./LandingPage";

// HTML elements
const statusEl = document.getElementById("status")!;
const messageInput = document.getElementById("messageInput") as HTMLInputElement;
const sendButton = document.getElementById("sendButton")!;
const messagesList = document.getElementById("messages")!;

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
      // TODO: Update your UI here
    });

    // 5. Handle incoming messages
    room.onMessage("*", (type, data) => {
      console.log(`📨 [${type}]`, data);
      switch (type) {
        case "mapData":
          const mapDisplay = document.getElementById("mapDisplay");
          if (mapDisplay) mapDisplay.textContent = data.map;
          break;
        default:
          break;
      }
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
        room.send(instruction, data);
        messageInput.value = "";
      }
    });
  }).catch((err: any) => {
    console.error("❌ Failed to join room:", err);
    statusEl.textContent = "❌ Failed to connect.";
  });
}

