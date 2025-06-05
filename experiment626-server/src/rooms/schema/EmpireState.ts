import { Schema, type } from "@colyseus/schema";
import { StarState } from "./StarState";

export class EmpireState extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") ownerId: string;
    // @type([StarState]) starsOwned: StarState[];
    @type("number") wealth: number;
    @type("number") researchPoints: number;
    @type("number") speed: number;
    @type("number") range: number;
    @type("number") battlePower: number;
}
    