import { ArraySchema, Schema, type } from "@colyseus/schema";
import { OccupiedSpaceState } from "../schema/OccupiedSpaceState";

export class GalaxyState extends Schema {

  @type("number") clockTime: number = 0;
  @type("string") id: string = "";
  @type(["string"]) playerIdList: ArraySchema<string> = new ArraySchema<string>();
  @type("number") startingResearchPoints: number = 0;
  @type("number") startingSpeed: number = 0;
  @type("number") startingRange: number = 0;
  @type("number") startingBattlePower: number = 0;
  @type("number") startingWealth: number = 0;
  @type("number") startingStars: number = 0;
  @type("number") startingShips: number = 0;
  @type("string") vpId: string = "";
  @type("string") size: string = "medium";
  @type([OccupiedSpaceState]) mapBlueprint: ArraySchema<OccupiedSpaceState> = new ArraySchema<OccupiedSpaceState>();
}
