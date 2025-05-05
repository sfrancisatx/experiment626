import { Schema, type, MapSchema } from "@colyseus/schema";
import { Player } from "./Player";
import { Star } from "./Star";
import { Empire } from "./Empire";
import { Fleet } from "./Fleet";

export class GalaxyRoomState extends Schema {
  @type({ map: Star }) stars = new MapSchema<Star>();
  @type({ map: Empire }) empires = new MapSchema<Empire>();
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Fleet }) fleets = new MapSchema<Fleet>();
  @type("number") tick: number = 0;
  @type("number") timeCompression: number = 1;
  @type("number") productionCadence: number = 24;

  constructor() {
    super();
  }

  generateGalaxy(numStars: number = 100) {
    const galaxyWidth = 1000;
    const galaxyHeight = 1000;

    for (let i = 0; i < numStars; i++) {
      const star = new Star(`star_${i}`, 0, 0);
      star.generatePosition(0, galaxyWidth, 0, galaxyHeight);
      star.generateAttributes();
      this.stars.set(star.id, star);
    }
  }
}
