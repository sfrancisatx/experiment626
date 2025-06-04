import { Schema, type } from "@colyseus/schema";

export class FleetState extends Schema {
    @type("string") id: string;
    @type("string") owner: string;
    @type("string") sourceStarId: string;
    @type("string") destinationStarId: string;
    @type("number") ships: number;
    @type("number") startTime: number;
    @type("number") endTime: number;
}