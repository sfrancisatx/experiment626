declare const Colyseus: any;

const client = new Colyseus.Client("ws://localhost:2567");
let room: any = null;

interface MessageData {
    type: string;
    content: string;
}

async function joinGame() {
    try {
        room = await client.joinOrCreate("galaxy");
        
        // Listen for messages from the server
        room.onMessage("message", (data: MessageData) => {
            updateStatus(`${data.type}: ${data.content}`);
        });

        // Listen for errors
        room.onError((code: number, message: string) => {
            console.error("Error:", code, message);
            updateStatus(`Error: ${message}`);
        });

        // Listen for disconnection
        room.onLeave((code: number) => {
            console.log("Disconnected:", code);
            updateStatus("Disconnected from server");
        });

        updateStatus("Connected to server!");
    } catch (e: any) {
        console.error("Error joining room:", e);
        updateStatus(`Error joining game: ${e.message}`);
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

    if (room) {
        room.send("message", {
            type: "custom",
            content: messageInput.value
        });
        messageInput.value = "";
        updateStatus("Message sent to server");
    } else {
        updateStatus("Not connected to server");
    }
}

// Initialize when the page loads
window.onload = async () => {
    await joinGame();
};
