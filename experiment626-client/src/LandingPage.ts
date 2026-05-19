// LandingPage.ts
// This module creates and manages the lobby landing page UI and logic, without breaking the existing UI.

import { Client, Room } from "colyseus.js";
import { 
  ensureAuthenticated, 
  getIdToken, 
  signInWithGoogle, 
  sendEmailLink, 
  completeEmailSignIn,
  signOut,
  isAnonymous,
  fetchUserGames,
  type GameAssociation
} from "./firebase";

export async function showLandingPage(client: Client) {
  // Ensure user is authenticated (anonymous auth if not logged in)
  const user = await ensureAuthenticated();
  console.log("Authenticated as:", user.uid, user.isAnonymous ? "(anonymous)" : "");

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

  // Auth status
  const authStatus = document.createElement("p");
  authStatus.id = "authStatus";
  authStatus.style.fontSize = "0.9rem";
  authStatus.style.color = "#666";
  updateAuthStatus(user);
  landing.appendChild(authStatus);

  function updateAuthStatus(u: typeof user) {
    authStatus.textContent = u.isAnonymous 
      ? "Playing as Guest" 
      : `Logged in as ${u.displayName || u.email || "User"}`;
  }

  // Name input (declared early so auth section can reference it)
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Enter your name";
  nameInput.value = user.displayName || "";
  nameInput.required = true;
  nameInput.style.marginRight = "1rem";

  // Auth buttons section (only show if anonymous)
  const authSection = document.createElement("div");
  authSection.id = "authSection";
  authSection.style.marginBottom = "1rem";
  authSection.style.padding = "1rem";
  authSection.style.background = "#e9ecef";
  authSection.style.borderRadius = "4px";

  if (user.isAnonymous) {
    const authLabel = document.createElement("p");
    authLabel.style.margin = "0 0 0.5rem 0";
    authLabel.style.fontWeight = "bold";
    authLabel.textContent = "Sign in to save your progress:";
    authSection.appendChild(authLabel);

    // Google Sign-In button
    const googleBtn = document.createElement("button");
    googleBtn.textContent = "🔵 Sign in with Google";
    googleBtn.style.marginRight = "0.5rem";
    googleBtn.onclick = async () => {
      try {
        googleBtn.disabled = true;
        googleBtn.textContent = "Signing in...";
        const newUser = await signInWithGoogle();
        updateAuthStatus(newUser);
        nameInput.value = newUser.displayName || nameInput.value;
        authSection.innerHTML = "<p style='color: green;'>✓ Signed in as " + (newUser.displayName || newUser.email) + "</p>";
      } catch (error: any) {
        console.error("Google sign-in error:", error);
        googleBtn.disabled = false;
        googleBtn.textContent = "🔵 Sign in with Google";
        alert("Sign-in failed: " + error.message);
      }
    };
    authSection.appendChild(googleBtn);

    // Email Link section
    const emailContainer = document.createElement("div");
    emailContainer.style.marginTop = "0.5rem";
    
    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.placeholder = "your@email.com";
    emailInput.style.marginRight = "0.5rem";
    emailContainer.appendChild(emailInput);

    const emailBtn = document.createElement("button");
    emailBtn.textContent = "📧 Send Magic Link";
    emailBtn.onclick = async () => {
      if (!emailInput.value || !emailInput.value.includes("@")) {
        alert("Please enter a valid email address.");
        return;
      }
      try {
        emailBtn.disabled = true;
        emailBtn.textContent = "Sending...";
        await sendEmailLink(emailInput.value);
        emailContainer.innerHTML = "<p style='color: green;'>✓ Check your email for the sign-in link!</p>";
      } catch (error: any) {
        console.error("Email link error:", error);
        emailBtn.disabled = false;
        emailBtn.textContent = "📧 Send Magic Link";
        alert("Failed to send email: " + error.message);
      }
    };
    emailContainer.appendChild(emailBtn);
    authSection.appendChild(emailContainer);
  } else {
    // Show signed-in state with sign-out option
    const signedInMsg = document.createElement("p");
    signedInMsg.style.margin = "0";
    signedInMsg.innerHTML = `✓ Signed in as <strong>${user.displayName || user.email}</strong>`;
    authSection.appendChild(signedInMsg);

    const signOutBtn = document.createElement("button");
    signOutBtn.textContent = "Sign Out";
    signOutBtn.style.marginTop = "0.5rem";
    signOutBtn.onclick = async () => {
      await signOut();
      window.location.reload();
    };
    authSection.appendChild(signOutBtn);
  }

  landing.appendChild(authSection);

  // Name input label (nameInput already declared above)
  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Player Name: ";
  nameLabel.appendChild(nameInput);
  landing.appendChild(nameLabel);

  landing.appendChild(document.createElement("br"));
  landing.appendChild(document.createElement("br"));

  // Your Games section (games user has joined before)
  const yourGamesSection = document.createElement("div");
  yourGamesSection.id = "yourGamesSection";
  yourGamesSection.style.marginBottom = "1.5rem";
  yourGamesSection.style.padding = "1rem";
  yourGamesSection.style.background = "#d4edda";
  yourGamesSection.style.borderRadius = "4px";
  yourGamesSection.style.display = "none"; // Hidden until we have games

  const yourGamesLabel = document.createElement("div");
  yourGamesLabel.style.fontWeight = "bold";
  yourGamesLabel.style.marginBottom = "0.5rem";
  yourGamesLabel.textContent = "🎮 Your Games:";
  yourGamesSection.appendChild(yourGamesLabel);

  const yourGamesList = document.createElement("ul");
  yourGamesList.id = "yourGamesList";
  yourGamesList.style.listStyle = "none";
  yourGamesList.style.padding = "0";
  yourGamesList.style.margin = "0";
  yourGamesSection.appendChild(yourGamesList);

  landing.appendChild(yourGamesSection);

  // Fetch and display user's games
  async function loadUserGames() {
    const games = await fetchUserGames();
    if (games.length > 0) {
      yourGamesSection.style.display = "block";
      yourGamesList.innerHTML = "";
      
      games.forEach((game: GameAssociation) => {
        const li = document.createElement("li");
        li.style.marginBottom = "0.5rem";
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.justifyContent = "space-between";

        const gameInfo = document.createElement("span");
        const lastActive = new Date(game.lastActiveAt).toLocaleDateString();
        gameInfo.textContent = `Galaxy ${game.galaxyId.substring(0, 8)}... (Last played: ${lastActive})`;
        li.appendChild(gameInfo);

        const rejoinBtn = document.createElement("button");
        rejoinBtn.textContent = "🔄 Rejoin";
        rejoinBtn.style.marginLeft = "0.5rem";
        rejoinBtn.onclick = () => {
          window.location.hash = "#game-" + game.galaxyId;
          window.location.reload();
        };
        li.appendChild(rejoinBtn);

        yourGamesList.appendChild(li);
      });
    }
  }

  // Load user games on page load
  loadUserGames();

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
  createBtn.onclick = async () => {
    if (!nameInput.value) {
      alert("Please enter your name first.");
      return;
    }
    const galaxyName = prompt("Enter a name for your galaxy:", nameInput.value + "'s Galaxy");
    if (!galaxyName) {
      return; // User cancelled
    }
    const idToken = await getIdToken();
    client.joinOrCreate("lobby", { name: nameInput.value, idToken }).then(lobbyRoom => {
      lobbyRoom.send("create_game", { options: { galaxyName: galaxyName } });
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
  async function requestGameList() {
    const idToken = await getIdToken();
    client.joinOrCreate("lobby", { name: nameInput.value || "Guest", idToken }).then(lobbyRoom => {
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
            joinBtn.onclick = async () => {
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
