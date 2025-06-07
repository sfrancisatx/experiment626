declare const Colyseus: any;

const client = new Colyseus.Client("ws://localhost:5111");
let room: any = null;

interface MessageData {
    type: string;
    content: string;
}

async function joinGame() {
    try {
        console.log("Attempting to join room...");
        
        // First join the room without options
        room = await client.joinOrCreate("galaxy");
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
        room.onMessage("message", (data: MessageData) => {
            console.log("Received message from server:", data);
            updateStatus(`${data.type}: ${data.content}`);
        });

        // Listen for errors
        room.onError = (code: number, message: string) => {
            console.error("Error:", code, message);
            updateStatus(`Error: ${message}`);
        };

        // Listen for successful join
        room.onJoin = (client: any) => {
            console.log("Successfully joined room as client:", client.sessionId);
            updateStatus(`Connected as client ${client.sessionId}`);
        };

        // Listen for disconnection
        room.onLeave = (code: number) => {
            console.log("Disconnected:", code);
            updateStatus(`Disconnected with code: ${code}`);
        };

        updateStatus("Connected to server!");
    } catch (error) {
        console.error("Error joining room:", error);
        updateStatus("Failed to join room");
    }
}

function updateStatus(message: string) {
    const statusDiv = document.getElementById("status") as HTMLDivElement;
    if (statusDiv) {
        statusDiv.textContent = message;
    }
}

function sendMessage() {
    const messageInput = document.getElementById("message") as HTMLInputElement;
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
window.onload = async () => {
    const messageInput = document.getElementById("message") as HTMLInputElement;
    const messageButton = document.getElementById("send") as HTMLButtonElement;
    messageButton.onclick = sendMessage;
    await joinGame();
};
