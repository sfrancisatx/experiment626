import { Room, Client } from "colyseus";
import { matchMaker } from "@colyseus/core";
import { LobbyState, LobbyPlayer, GalaxySummary } from "./schema/LobbyState";

export class LobbyRoom extends Room<LobbyState> {
  maxClients = 64;

  onCreate(options: any) {
    this.state = new LobbyState();

    // Periodically update the list of running Galaxy rooms
    this.setSimulationInterval(() => this.updateGalaxyList(), 2000);

    // Message handler for listing games
    this.onMessage("list_games", (client, message) => {
      this.sendGalaxyListToClient(client);
    });

    // Message handler for creating a new Galaxy game
    this.onMessage("create_game", async (client, data) => {
      try {
        const options = data?.options || {};
        // You can customize options (e.g., name, settings) as needed
        const room = await matchMaker.createRoom("game_room", options);
        client.send("game_created", { roomId: room.roomId });
        // Optionally, update the galaxy list immediately
        await this.updateGalaxyList();
      } catch (err) {
        client.send("error", { message: "Failed to create game.", details: (err as Error)?.message });
      }
    });

    // Message handler for joining an existing Galaxy game
    this.onMessage("join_game", async (client, data) => {
      try {
        const roomId = data?.roomId;
        if (!roomId) throw new Error("No roomId provided");
        // Optionally, check if the room exists
        // Just echo the roomId back to the client for direct join
        client.send("game_join", { roomId });
      } catch (err) {
        let details = "Unknown error";
        if (err && typeof err === "object" && "message" in err) {
          details = (err as { message: string }).message;
        }
        client.send("error", { message: "Failed to join game.", details });
      }
    });
  }

  async updateGalaxyList() {
    // Query all running Galaxy rooms using Colyseus matchMaker
    const rooms = await matchMaker.query({ name: "game_room" });

    // Clear and repopulate the galaxies list
    this.state.galaxies.clear();
    for (const room of rooms) {
      const summary = new GalaxySummary();
      summary.roomId = room.roomId || room.id || "";
      summary.name = room.name || room.roomId || room.id || "Unnamed";
      summary.status = room.locked ? "in-progress" : "open";
      summary.playerCount = room.clients || 0;
      this.state.galaxies.push(summary);
    }
  }

  sendGalaxyListToClient(client: Client) {
    // Send a simple message with the current list of galaxies
    client.send("galaxy_list", this.state.galaxies.map(g => ({
      roomId: g.roomId,
      name: g.name,
      status: g.status,
      playerCount: g.playerCount
    })));
  }

  onJoin(client: Client, options: any) {
    const player = new LobbyPlayer();
    player.name = options.name || "Guest";
    player.sessionId = client.sessionId;
    this.state.players.set(client.sessionId, player);
    this.updateGalaxyList();
    // TODO: send initial galaxy list
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.updateGalaxyList();
  }
}
