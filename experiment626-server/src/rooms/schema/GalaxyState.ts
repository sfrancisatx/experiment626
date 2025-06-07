import { Schema, type } from "@colyseus/schema";
import { StarState } from "./StarState";
import { FleetState } from "./FleetState";
import { EmpireState } from "./EmpireState";

export class GalaxyState extends Schema {

  @type("number") clockTime: number = 0;
  @type(["string"]) playerIdList: string[] = [];
  @type(["EmpireState"]) empireStateList: EmpireState[] = [];
  @type("number") startingResearchPoints: number = 0;
  @type("number") startingSpeed: number = 0;
  @type("number") startingRange: number = 0;
  @type("number") startingBattlePower: number = 0;
  @type("number") startingWealth: number = 0;
  @type("number") startingStars: number = 0;
  @type("number") startingShips: number = 0;
  @type("string") vpId: string = "";
}
