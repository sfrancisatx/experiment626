import { Schema, type } from "@colyseus/schema";

export class Star extends Schema {
  @type("string") id: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") size: number = 1; // 1-5
  @type("string") owner: string = ""; // session ID of the player who owns this star
  @type("number") wealth: number = 0; // resources produced by this star
  @type("number") numShips: number = 0;
  @type("boolean") isDead: boolean = false;
  @type("string") empireID: string = "";

  constructor(id: string, x: number, y: number) {
    super();
    this.id = id;
    this.x = x;
    this.y = y;
  }

  generatePosition(minX: number, maxX: number, minY: number, maxY: number) {
    this.x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    this.y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
  }

  generateAttributes() {
    this.size = Math.floor(Math.random() * 5) + 1;
    this.wealth = Math.floor(Math.random() * 901) + 100; // 100-1000 resources
    this.numShips = Math.floor(Math.random() * 10) + 1; // 1-10 ships
  }
}
