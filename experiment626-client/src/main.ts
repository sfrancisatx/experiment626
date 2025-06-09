import { GalaxyState } from "./colyseusTypes/GalaxyState";
import { Client, Room } from "colyseus.js";

// HTML elements
const statusEl = document.getElementById("status")!;
const messageInput = document.getElementById("messageInput") as HTMLInputElement;
const sendButton = document.getElementById("sendButton")!;
const messagesList = document.getElementById("messages")!;

// 1. Connect to the Colyseus server
const client = new Client("ws://localhost:2567");

// 2. Join or create a room
client.joinOrCreate<GalaxyState>("game_room").then((room: Room<GalaxyState>) => {
  console.log("✅ Joined room:", room.roomId);
  statusEl.textContent = `✅ Connected to room: ${room.roomId}`;

  // 3. React to server-side state changes
  room.onStateChange((state) => {
    console.log("🌀 State updated:", state);
    // TODO: Update your UI here
  });

  // 4. Send a test message
  room.send("pickup", { itemId: "abc123" });

  // 5. Handle incoming messages
  room.onMessage("*", (type, data) => {
    console.log(`📨 [${type}]`, data);
    const li = document.createElement("li");
    li.textContent = `📩 [${type}] ${JSON.stringify(data)}`;
    messagesList.appendChild(li);
  });

  // 6. Handle keyboard input
  document.addEventListener("keydown", (e) => {
    if (e.key === "p") {
      room.send("pickup", { itemId: "abc123" });
    }
  });

  // 7. Handle UI input for chat/messages
  sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
      room.send("chat", { message });
      messageInput.value = "";
    }
  });

}).catch((err) => {
  console.error("❌ Failed to join room:", err);
  statusEl.textContent = "❌ Failed to connect.";
});
