// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.39
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema } from '@colyseus/schema';
import type { DataChange } from '@colyseus/schema';


export class GalaxyState extends Schema {
    @type("number") public clockTime!: number;
    @type("string") public id!: string;
    @type([ "string" ]) public playerIdList: ArraySchema<string> = new ArraySchema<string>();
    @type("number") public startingResearchPoints!: number;
    @type("number") public startingSpeed!: number;
    @type("number") public startingRange!: number;
    @type("number") public startingBattlePower!: number;
    @type("number") public startingWealth!: number;
    @type("number") public startingStars!: number;
    @type("number") public startingShips!: number;
    @type("string") public vpId!: string;
    @type("string") public size!: string;
}
