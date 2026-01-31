// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.39
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';


export class EmpireState extends Schema {
    @type("string") public id!: string;
    @type("string") public name!: string;
    @type("string") public ownerId!: string;
    @type("number") public wealth!: number;
    @type("number") public factoryCost!: number;
    @type("number") public speed!: number;
    @type("number") public range!: number;
    @type("number") public battlePower!: number;
    @type("number") public speedCost!: number;
    @type("number") public rangeCost!: number;
    @type("number") public battlePowerCost!: number;
}
