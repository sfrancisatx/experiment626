import { Schema, type } from "@colyseus/schema";
import { StarState } from "./StarState";
import { FleetState } from "./FleetState";
import { ArraySchema } from "@colyseus/schema";

export class PlayerViewState extends Schema {
    @type([StarState]) starList: ArraySchema<StarState> = new ArraySchema<StarState>();
    @type([FleetState]) fleetList: ArraySchema<FleetState> = new ArraySchema<FleetState>();
    @type("string") sessionId: string = "";
}