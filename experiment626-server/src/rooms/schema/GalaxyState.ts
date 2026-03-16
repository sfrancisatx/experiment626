import { ArraySchema, Schema, type } from "@colyseus/schema";

export class GalaxyState extends Schema {

  @type("number") clockTime: number = 0;
  @type("string") id: string = "";
  @type("string") galaxyName: string = "";
  @type(["string"]) playerIdList: ArraySchema<string> = new ArraySchema<string>();
  @type("number") startingSpeed: number = 0;
  @type("number") startingRange: number = 0;
  @type("number") startingBattlePower: number = 0;
  @type("number") startingWealth: number = 0;
  @type("number") startingStars: number = 0;
  @type("number") startingShips: number = 0;
  @type("number") factoryCost: number = 0;
  @type("number") startingSpeedCost: number = 0;
  @type("number") startingRangeCost: number = 0;
  @type("number") startingBattlePowerCost: number = 0;
  @type("string") vpId: string = "";
  @type("string") size: string = "itty";
  @type("number") minimumDistanceBetweenStars: number = 5;
  @type("number") visibilityLevel: number = 0;
}
