// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.39
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { OccupiedSpaceState } from './OccupiedSpaceState'

export class GalaxyState extends Schema {
    @type("number") public clockTime!: number;
    @type("string") public id!: string;
    @type([ "string" ]) public playerIdList: ArraySchema<string> = new ArraySchema<string>();
    @type("number") public startingSpeed!: number;
    @type("number") public startingRange!: number;
    @type("number") public startingBattlePower!: number;
    @type("number") public startingWealth!: number;
    @type("number") public startingStars!: number;
    @type("number") public startingShips!: number;
    @type("number") public factoryCost!: number;
    @type("number") public startingSpeedCost!: number;
    @type("number") public startingRangeCost!: number;
    @type("number") public startingBattlePowerCost!: number;
    @type("string") public vpId!: string;
    @type("string") public size!: string;
    @type([ OccupiedSpaceState ]) public mapBlueprint: ArraySchema<OccupiedSpaceState> = new ArraySchema<OccupiedSpaceState>();
}
