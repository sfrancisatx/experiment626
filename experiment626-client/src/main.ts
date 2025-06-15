import { GalaxyState } from "./colyseusTypes/GalaxyState";
import { Client, Room } from "colyseus.js";

// HTML elements
const statusEl = document.getElementById("status")!;
const messageInput = document.getElementById("messageInput") as HTMLInputElement;
const sendButton = document.getElementById("sendButton")!;
const messagesList = document.getElementById("messages")!;

// 1. Connect to the Colyseus server
const client = new Client("ws://localhost:5111");

// 2. Join or create a room
const empireName = prompt("Enter your empire name:");
client.joinOrCreate<GalaxyState>("game_room", {empireName}).then((room: Room<GalaxyState>) => {
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
    var message = messageInput.value.trim();
    if (message) {
      var data = {};
      var index = message.indexOf(".");
      var instruction = message;
      if (index !== -1) {
        instruction = message.substring(0, index);
        var other = message.substring(index + 1);
        switch (instruction) {
          case "createFleet":
            index = other.indexOf(".");
            var sourceStarId = other.substring(0, index);
            other = other.substring(index + 1);
            index = other.indexOf(".");
            var destinationStarId = other.substring(0, index);
            other = other.substring(index + 1);
            var ships = parseInt(other);
            data = { sourceStarId: sourceStarId, destinationStarId: destinationStarId, ships: ships };
            break;
          case "renameStar":
            index = other.indexOf(".");
            var id = other.substring(0, index);
            other = other.substring(index + 1);
            var name = other;
            data = { id: id, name: name };
            break;
          case "destroyFleet":
            var id = other;
            data = { id: id };
            break;
          case "init":
            var generationMethod = other;
            data = { generationMethod: generationMethod };
            break;
          default:
            break;
        }
      }
      room.send(instruction, data);
      messageInput.value = "";
    }
  });

}).catch((err) => {
  console.error("❌ Failed to join room:", err);
  statusEl.textContent = "❌ Failed to connect.";
});
