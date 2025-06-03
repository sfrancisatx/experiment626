import { Schema, type } from "@colyseus/schema";

export class StarState extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") owner: string;
    @type("number") x: number;
    @type("number") y: number;
    @type("number") wealthProduction: number;
    @type("number") shipProduction: number;
    @type("number") shipCount: number;
}