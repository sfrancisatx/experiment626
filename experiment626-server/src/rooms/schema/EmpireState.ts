import { Schema, type } from "@colyseus/schema";

export class EmpireState extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") owner: string;
}
    