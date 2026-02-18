// LandingPage.ts
// This module creates and manages the lobby landing page UI and logic, without breaking the existing UI.

import { Client, Room } from "colyseus.js";

export function showLandingPage(client: Client) {
  // Create landing page container
  const landing = document.createElement("div");
  landing.id = "landingPage";
  landing.style.padding = "2rem";
  landing.style.maxWidth = "600px";
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
    client.joinOrCreate("lobby", { name: nameInput.value }).then(lobbyRoom => {
      lobbyRoom.send("create_game", { options: { name: nameInput.value + "'s Galaxy" } });
      lobbyRoom.onMessage("game_created", ({ roomId }) => {
        window.location.hash = "#game-" + roomId;
        window.location.reload();
      });
    });
  };
  landing.appendChild(createBtn);

  // Append landing page to body (or #app)
  const app = document.getElementById("app");
  if (app) {
    app.style.display = "none";
    document.body.appendChild(landing);
  }

  // Request and render game list
  function requestGameList() {
    client.joinOrCreate("lobby", { name: nameInput.value || "Guest" }).then(lobbyRoom => {
      lobbyRoom.send("list_games");
      lobbyRoom.onMessage("galaxy_list", (games) => {
        gameList.innerHTML = "";
        if (!games.length) {
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
              lobbyRoom.onMessage("game_join", ({ roomId }) => {
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

  // Initial game list fetch
  requestGameList();
}
