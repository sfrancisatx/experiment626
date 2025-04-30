import { Room, Client } from "@colyseus/core";
import { GalaxyRoomState } from "./schema/GalaxyRoomState";
import { Empire } from "./schema/Empire";
import { Player } from "./schema/Player";
import { Star } from "./schema/Star";

export class Galaxy extends Room<GalaxyRoomState> {
  maxClients = 8;
  state = new GalaxyRoomState();

  // Generate random position within galaxy bounds
  private generateRandomPosition(minX: number, maxX: number, minY: number, maxY: number): [number, number] {
    return [
      Math.random() * (maxX - minX) + minX,
      Math.random() * (maxY - minY) + minY
    ];
  }

  // Generate a new star with random position and attributes
  private generateStar(id: string, minX: number, maxX: number, minY: number, maxY: number): Star {
    const [x, y] = this.generateRandomPosition(minX, maxX, minY, maxY);
    const star = new Star(id, x, y);
    star.generateAttributes();
    return star;
  }

  onCreate (options: any) {
    console.log("Galaxy created!", options);
    
    // Generate initial galaxy with stars
    this.state.generateGalaxy(100);

    // Set up interval for game ticks
    this.setSimulationInterval(() => {
      this.state.tick++;
      this.updateGame();
    }, 1000);

    // Message handlers
    this.onMessage("claimStar", (client, starId: string) => {
      this.claimStar(client, starId);
    });

    this.onMessage("sendFleet", (client, data: { targetStarId: string, ships: number }) => {
      this.sendFleet(client, data.targetStarId, data.ships);
    });
  }

  onJoin (client: Client, options: any) {
    // Create player and empire
    const empire = new Empire(
      `Empire_${client.sessionId}`,
      `#${Math.floor(Math.random()*16777215).toString(16)}`
    );
    const player = new Player();
    
    // Set the player as the empire's leader
    empire.leader = player;
    
    this.state.empires.set(client.sessionId, empire);
    this.state.players.set(client.sessionId, player);
    
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    // Remove player and empire when they leave
    this.state.empires.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("Galaxy room", this.roomId, "disposing...");
  }

  private updateGame() {
    // Update all empires' resources
    for (const [sessionId, empire] of this.state.empires.entries()) {
      empire.updateResources(this.state.stars);
    }
  }

  private claimStar(client: Client, starId: string) {
    const star = this.state.stars.get(starId);
    if (!star) return;

    const empire = this.state.empires.get(client.sessionId);
    if (!empire) return;

    // Only allow claiming if star is not already owned
    if (star.owner === "") {
      star.owner = client.sessionId;
      empire.addStar(starId);
    }
  }

  private sendFleet(client: Client, targetStarId: string, ships: number) {
    const empire = this.state.empires.get(client.sessionId);
    if (!empire) return;

    // Check if player has enough ships
    if (ships > empire.shipCount) return;

    // TODO: Implement fleet movement logic
    console.log(`${empire.name} sent ${ships} ships to ${targetStarId}`);
  }
}
