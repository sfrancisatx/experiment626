import { Room, Client } from "@colyseus/core";
import { GalaxyRoomState } from "./schema/GalaxyRoomState";
import { Empire } from "./schema/Empire";
import { Player } from "./schema/Player";
import { Fleet } from "./schema/Fleet";

/*
* Galaxy
* Effectively this class is the game loop - and manages all the inbound messages
* as well as triggering broadcasts of messages to clients when needed. 
* It will contain a reference to the GalaxyState which is the master state object
* that contains all the game data.
*/

export class Galaxy extends Room<GalaxyRoomState> {
  maxClients = 8;
  
  // Game speed settings
  timeCompression = 1; // 1x speed
  productionCadence = 24; // 24 ticks per day
  
  // Galaxy defaults
  galaxyDefaults = {
    duration: 1000, // 1000 ticks game duration
    factoryCost: 100,
    speedCost: 50,
    rangeCost: 75,
    battlePowerCost: 150
  };

  onCreate (options: any) {
    console.log("Galaxy created!", options);
    
    // Initialize galaxy with specified settings
    const numStars = options.numStars || 100;
    const empireCount = options.empireCount || 8;
    
    // Generate initial galaxy with stars
    this.state.generateGalaxy(numStars);
    
    // Assign home stars to empires
    const availableStars = Array.from(this.state.stars.values());
    const starsPerEmpire = Math.floor(availableStars.length / empireCount);
    
    // Set up interval for game ticks
    // this is 1000 ms or 1 second
    this.setSimulationInterval(() => {
      this.state.tick++;
      this.updateGame();
    }, 1000 / this.timeCompression);

    // Message handlers
    this.onMessage("claimStar", (client, starId: string) => {
      this.claimStar(client, starId);
    });

    this.onMessage("sendFleet", (client, data: { targetStarId: string, ships: number }) => {
      this.sendFleet(client, data.targetStarId, data.ships);
    });
  }

  onJoin (client: Client, options: any) {
    // Create player and empire, assigning a string for color
    let player = new Player(client.sessionId);
    let empire = new Empire(
      `Empire_${client.sessionId}`,
      `#${Math.floor(Math.random()*16777215).toString(16)}`
    );
    
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
      if (empire.homeStar) {
        const homeStar = this.state.stars.get(empire.homeStar);
        if (homeStar && homeStar.owner === sessionId) {
          // Collect resources from home star
          empire.totalResources += homeStar.wealth;
          
          // Update ship production
          if (this.state.tick % this.productionCadence === 0) {
            empire.shipCount += empire.shipProductionRate;
          }
        }
      }
    }
  }

  private claimStar(client: Client, starId: string) {
    const star = this.state.stars.get(starId);
    if (!star) return;

    const empire = this.state.empires.get(client.sessionId);
    if (!empire) return;

    // Check if star belongs to empire or is unclaimed
    if (star.owner !== client.sessionId && star.owner !== "") {
      // Star is owned by another empire
      return;
    }

    // Move ships to the star
    if (empire.shipCount < 10) {
      return; // Need at least 10 ships to claim
    }

    // Send 10 ships to the star
    empire.shipCount -= 10;
    star.numShips = 10;
    star.owner = sessionId;
    empire.addStar(starId);

    // Broadcast the claim to all players
    this.broadcast("starClaimed", {
      starId,
      empireId: sessionId,
      ships: 10
    });
  }

  private sendFleet(client: Client, targetStarId: string, ships: number) {
    const empire = this.state.empires.get(client.sessionId);
    if (!empire) return;

    // Check if player has enough ships
    if (ships > empire.shipCount) return;

    // Find source and target stars
    const sourceStar = this.state.stars.get(empire.homeStar);
    const targetStar = this.state.stars.get(targetStarId);
    
    if (!sourceStar || !targetStar) return;

    // Calculate distance and travel time
    const distance = Math.sqrt(
      Math.pow(targetStar.x - sourceStar.x, 2) +
      Math.pow(targetStar.y - sourceStar.y, 2)
    );

    // Create fleet movement object
    const fleet = new Fleet(
      `fleet_${this.state.fleets.size}`,
      empire.id,
      ships,
      empire.shipProductionRate,
      this.galaxyDefaults.rangeCost,
      sourceStar.id,
      targetStar.id,
      this.state
    );

    // Store fleet movement
    this.state.fleets.set(fleet.id, fleet);

    // Update ship counts
    sourceStar.numShips -= ships;
    empire.shipCount -= ships;

    // Broadcast fleet movement
    this.broadcast("fleetMovement", {
      fleetId: fleet.id,
      sourceStar: sourceStar.id,
      targetStar: targetStar.id,
      ships
    });
  }
}
