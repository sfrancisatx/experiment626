"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LobbyRoom = void 0;
const colyseus_1 = require("colyseus");
const core_1 = require("@colyseus/core");
const LobbyState_1 = require("./schema/LobbyState");
class LobbyRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 64;
    }
    onCreate(options) {
        this.state = new LobbyState_1.LobbyState();
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
                const room = await core_1.matchMaker.createRoom("game_room", options);
                client.send("game_created", { roomId: room.roomId });
                // Optionally, update the galaxy list immediately
                await this.updateGalaxyList();
            }
            catch (err) {
                client.send("error", { message: "Failed to create game.", details: err?.message });
            }
        });
        // Message handler for joining an existing Galaxy game
        this.onMessage("join_game", async (client, data) => {
            try {
                const roomId = data?.roomId;
                if (!roomId)
                    throw new Error("No roomId provided");
                // Optionally, check if the room exists
                // Just echo the roomId back to the client for direct join
                client.send("game_join", { roomId });
            }
            catch (err) {
                let details = "Unknown error";
                if (err && typeof err === "object" && "message" in err) {
                    details = err.message;
                }
                client.send("error", { message: "Failed to join game.", details });
            }
        });
    }
    async updateGalaxyList() {
        // Query all running Galaxy rooms using Colyseus matchMaker
        const rooms = await core_1.matchMaker.query({ name: "game_room" });
        // Clear and repopulate the galaxies list
        this.state.galaxies.clear();
        for (const room of rooms) {
            const summary = new LobbyState_1.GalaxySummary();
            summary.roomId = room.roomId || room.id || "";
            // Use metadata.galaxyName if available, otherwise fall back to roomId
            summary.name = (room.metadata?.galaxyName) || room.roomId || room.id || "Unnamed";
            summary.status = room.locked ? "in-progress" : "open";
            summary.playerCount = room.clients || 0;
            this.state.galaxies.push(summary);
        }
    }
    sendGalaxyListToClient(client) {
        // Send a simple message with the current list of galaxies
        client.send("galaxy_list", this.state.galaxies.map(g => ({
            roomId: g.roomId,
            name: g.name,
            status: g.status,
            playerCount: g.playerCount
        })));
    }
    onJoin(client, options) {
        const player = new LobbyState_1.LobbyPlayer();
        player.name = options.name || "Guest";
        player.sessionId = client.sessionId;
        this.state.players.set(client.sessionId, player);
        this.updateGalaxyList();
        // TODO: send initial galaxy list
    }
    onLeave(client) {
        this.state.players.delete(client.sessionId);
        this.updateGalaxyList();
    }
}
exports.LobbyRoom = LobbyRoom;
