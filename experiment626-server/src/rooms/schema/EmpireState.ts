import { Schema, type } from "@colyseus/schema";

export class EmpireState extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") ownerId: string = "";
    @type("number") wealth: number = 0;
    @type("number") factoryCost: number = 0;
    @type("number") speed: number = 0;
    @type("number") range: number = 0;
    @type("number") battlePower: number = 0;
    @type("number") speedCost: number = 0;
    @type("number") rangeCost: number = 0;
    @type("number") battlePowerCost: number = 0;
}
    