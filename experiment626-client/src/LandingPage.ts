// LandingPage.ts
// Self-contained landing page for connecting to Colyseus server
import { Client, Room } from "colyseus.js";

export function showLandingPage(client: Client): void {
  // Remove any existing landing page
  const oldLanding = document.getElementById("landingPage");
  if (oldLanding) oldLanding.remove();

  // Create landing page container
  const landing = document.createElement("div");
  landing.id = "landingPage";
  landing.style.padding = "2rem";
  landing.style.maxWidth = "400px";
  landing.style.margin = "2rem auto";
  landing.style.background = "#f8f9fa";
  landing.style.borderRadius = "8px";
  landing.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";

  // Title
  const title = document.createElement("h2");
  title.textContent = "🌌 Welcome to Experiment 626";
  landing.appendChild(title);

  // Name input
  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Player Name: ";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Enter your name";
  nameInput.required = true;
  nameInput.style.marginRight = "1rem";
  nameLabel.appendChild(nameInput);
  landing.appendChild(nameLabel);

  landing.appendChild(document.createElement("br"));
  landing.appendChild(document.createElement("br"));

  // Game list
  const gameListLabel = document.createElement("div");
  gameListLabel.textContent = "Available Games:";
  landing.appendChild(gameListLabel);
  const gameList = document.createElement("ul");
  gameList.id = "gameList";
  gameList.style.listStyle = "none";
  gameList.style.padding = "0";
  landing.appendChild(gameList);

  // Helper to request and render game list
  function requestGameList() {
    client.joinOrCreate("lobby", { name: nameInput.value || "Guest" }).then(lobbyRoom => {
      lobbyRoom.onMessage("__playground_message_types", (msg: any) => {
        console.debug("[Colyseus] __playground_message_types received:", msg);
      });
      lobbyRoom.send("list_games");
      lobbyRoom.onMessage("galaxy_list", (games: any[] | null) => {
        gameList.innerHTML = "";
        if (!games || !games.length) {
          const li = document.createElement("li");
          li.textContent = "No games available.";
          gameList.appendChild(li);
        } else {
          games.forEach((g: any) => {
            const li = document.createElement("li");
            li.style.marginBottom = "0.5rem";
            li.textContent = `${g.name} [${g.status}, ${g.playerCount} players]`;
            const joinBtn = document.createElement("button");
            joinBtn.textContent = "Join";
            joinBtn.onclick = () => {
              lobbyRoom.send("join_game", { roomId: g.roomId });
              lobbyRoom.onMessage("game_join", (roomId: string) => {
                window.location.hash = "#game-" + roomId;
                window.location.reload();
              });
            };
            li.appendChild(joinBtn);
            gameList.appendChild(li);
          });
        }
      });
    });
  }

  // Refresh button
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "🔄 Refresh";
  refreshBtn.onclick = () => requestGameList();
  landing.appendChild(refreshBtn);

  // Create game button
  const createBtn = document.createElement("button");
  createBtn.textContent = "➕ Create New Game";
  createBtn.style.marginLeft = "1rem";
  createBtn.onclick = () => {
    if (!nameInput.value) {
      alert("Please enter your name first.");
      return;
    }
    client.joinOrCreate("lobby", { name: nameInput.value }).then((lobbyRoom: Room) => {
      lobbyRoom.onMessage("__playground_message_types", (msg: any) => {
        console.debug("[Colyseus] __playground_message_types received:", msg);
      });
      lobbyRoom.send("create_game", { options: { name: nameInput.value + "'s Galaxy" } });
      lobbyRoom.onMessage("game_created", ({ roomId }) => {
        window.location.hash = "#game-" + roomId;
        window.location.reload();
      });
    });
  };
  landing.appendChild(createBtn);

  // Status display
  const statusDiv = document.createElement("div");
  statusDiv.id = "status";
  statusDiv.style.marginTop = "1rem";
  statusDiv.style.color = "#333";
  landing.appendChild(statusDiv);

  // Connect button
  const connectBtn = document.createElement("button");
  connectBtn.textContent = "Connect";
  landing.appendChild(connectBtn);

  // Connect logic
  connectBtn.onclick = async function () {
    const name = nameInput.value.trim();
    if (!name) {
      statusDiv.textContent = "Please enter your name!";
      return;
    }
    statusDiv.textContent = "Connecting...";
    try {
      const room = await client.joinOrCreate("lobby", { name });
      room.onMessage("__playground_message_types", (msg: any) => {
        console.debug("[Colyseus] __playground_message_types received:", msg);
      });
      statusDiv.textContent = `Connected! Room ID: ${room.roomId}`;
      // Optionally, trigger callback or redirect here
    } catch (err) {
      statusDiv.textContent = "Failed to connect: " + err;
    }
  };

  // Append landing page to body (or #app)
  const app = document.getElementById("app");
  if (app) {
    app.style.display = "none";
    document.body.appendChild(landing);
  } else {
    document.body.appendChild(landing);
  }

  // Initial game list fetch
  requestGameList();
}
