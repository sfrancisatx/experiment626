"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const client = new Colyseus.Client("ws://localhost:5111");
let room = null;
function joinGame() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Attempting to join room...");
            // First join the room without options
            room = yield client.joinOrCreate("galaxy");
            console.log("Room joined successfully!");
            // Then send initialization message with options
            const options = {
                startingResearchPoints: 100,
                startingSpeed: 1,
                startingRange: 100,
                startingBattlePower: 10,
                startingWealth: 1000,
                startingStars: 10,
                startingShips: 5,
                playerIdList: [client.sessionId]
            };
            // Send initialization message
            room.send("initialize", options);
            console.log("Sent initialization options:", options);
            console.log("Successfully joined room!");
            // Listen for messages from the server
            room.onMessage("message", (data) => {
                console.log("Received message from server:", data);
                updateStatus(`${data.type}: ${data.content}`);
            });
            // Listen for errors
            room.onError = (code, message) => {
                console.error("Error:", code, message);
                updateStatus(`Error: ${message}`);
            };
            // Listen for successful join
            room.onJoin = (client) => {
                console.log("Successfully joined room as client:", client.sessionId);
                updateStatus(`Connected as client ${client.sessionId}`);
            };
            // Listen for disconnection
            room.onLeave = (code) => {
                console.log("Disconnected:", code);
                updateStatus(`Disconnected with code: ${code}`);
            };
            updateStatus("Connected to server!");
        }
        catch (error) {
            console.error("Error joining room:", error);
            updateStatus("Failed to join room");
        }
    });
}
function updateStatus(message) {
    const statusDiv = document.getElementById("status");
    if (statusDiv) {
        statusDiv.textContent = message;
    }
}
function sendMessage() {
    const messageInput = document.getElementById("message");
    if (!messageInput.value) {
        updateStatus("Please enter a message");
        return;
    }
    if (!room) {
        updateStatus("Not connected to server");
        return;
    }
    console.log("Sending message to server:", {
        type: "custom",
        content: messageInput.value
    });
    room.send("message", {
        type: "custom",
        content: messageInput.value
    });
    messageInput.value = "";
    updateStatus("Message sent to server");
}
// Initialize when the page loads
window.onload = () => __awaiter(void 0, void 0, void 0, function* () {
    const messageInput = document.getElementById("message");
    const messageButton = document.getElementById("send");
    messageButton.onclick = sendMessage;
    yield joinGame();
});
