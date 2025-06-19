import { Schema, type } from "@colyseus/schema";

export class OccupiedSpaceState extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("string") type: string = "";
    @type("string") owner?: string;
}