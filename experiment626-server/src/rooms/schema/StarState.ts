import { Schema, type } from "@colyseus/schema";

export class StarState extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") owner: string = "";
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") wealthProduction: number = 0;
    @type("number") shipProduction: number = 0;
    @type("number") shipCount: number = 0;
}