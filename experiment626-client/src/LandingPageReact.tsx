import React, { useState, useEffect } from "react";
import { Client, Room } from "colyseus.js";

interface LandingPageReactProps {
  client: Client;
}

interface Game {
  roomId: string;
  name: string;
}

export const LandingPageReact: React.FC<LandingPageReactProps> = ({ client }) => {
  const [name, setName] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch game list
  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const lobbyRoom: Room = await client.joinOrCreate("lobby", { name: name || "Guest" });
      lobbyRoom.send("list_games");
      lobbyRoom.onMessage("galaxy_list", (games: any[] | null) => {
        setGames(games || []);
        setLoading(false);
      });
    } catch (err: any) {
      setError("Failed to fetch games.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line
  }, []);

  const handleCreate = async () => {
    if (!name) {
      alert("Please enter your name first.");
      return;
    }
    try {
      const lobbyRoom = await client.joinOrCreate("lobby", { name });
      lobbyRoom.onMessage("__playground_message_types", (msg: any) => {
        console.debug("[Colyseus] __playground_message_types received:", msg);
      });
      lobbyRoom.send("create_game", { options: { name: name + "'s Galaxy" } });
      lobbyRoom.onMessage("game_created", ({ roomId }) => {
        window.location.hash = "#game-" + roomId;
        window.location.reload();
      });
    } catch (err) {
      alert("Failed to create game.");
    }
  };

  const handleJoin = async (roomId: string) => {
    try {
      const lobbyRoom = await client.joinOrCreate("lobby", { name: name || "Guest" });
      lobbyRoom.onMessage("__playground_message_types", (msg: any) => {
        console.debug("[Colyseus] __playground_message_types received:", msg);
      });
      lobbyRoom.send("join_game", { roomId });
      lobbyRoom.onMessage("game_join", (joinedRoomId: string) => {
        window.location.hash = "#game-" + joinedRoomId;
        window.location.reload();
      });
    } catch (err) {
      alert("Failed to join game.");
    }
  };

  return (
    <div id="landingPage" style={{ padding: "2rem", maxWidth: 400, margin: "2rem auto", background: "#f8f9fa", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
      <h2>🌌 Welcome to Experiment 626</h2>
      <label>
        Player Name:{" "}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name"
          style={{ marginLeft: 8 }}
        />
      </label>
      <button onClick={handleCreate} style={{ marginLeft: "1rem" }}>➕ Create New Game</button>
      <hr style={{ margin: "1.5rem 0" }} />
      <h3>Available Galaxies</h3>
      {loading ? (
        <div>Loading games...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <ul>
          {games.length === 0 ? (
            <li>No galaxies found. Create one!</li>
          ) : (
            games.map(g => (
              <li key={g.roomId} style={{ marginBottom: 8 }}>
                <span>{g.name || g.roomId}</span>
                <button style={{ marginLeft: 12 }} onClick={() => handleJoin(g.roomId)}>Join</button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
