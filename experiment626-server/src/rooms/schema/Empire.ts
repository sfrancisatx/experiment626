import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { Star } from "./Star";
import { Player } from "./Player";

export class Empire extends Schema {
  @type("string") id: string;
  @type("string") name: string = "";
  @type("string") color: string = "#FFFFFF";
  @type("number") totalResources: number = 0;
  @type("number") researchPoints: number = 0;
  @type("number") shipCount: number = 0;
  @type("number") shipProductionRate: number = 1;
  @type("string") homeStar: string = "";
  @type(["string"]) controlledStars: ArraySchema<string> = new ArraySchema<string>();
  @type(Player) leader: Player | null = null;

  constructor(name: string, color: string) {
    super();
    this.name = name;
    this.color = color;
    this.controlledStars = new ArraySchema<string>();
  }

  updateResources(stars: MapSchema<Star>) {
    let total = 0;
    for (const starId of this.controlledStars) {
      const star = stars.get(starId);
      if (star) {
        total += star.wealth;
      }
    }
    this.totalResources = total;
  }

  addStar(starId: string) {
    if (!this.controlledStars.includes(starId)) {
      this.controlledStars.push(starId);
    }
  }

  removeStar(starId: string) {
    const index = this.controlledStars.indexOf(starId);
    if (index > -1) {
      this.controlledStars.splice(index, 1);
    }
  }
}
