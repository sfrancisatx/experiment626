import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
    @type("string") id: string;
    @type("string") name: string;
}
    