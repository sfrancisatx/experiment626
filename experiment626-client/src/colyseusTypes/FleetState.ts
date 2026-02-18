// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.39
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, type DataChange } from '@colyseus/schema';


export class FleetState extends Schema {
    @type("string") public id!: string;
    @type("string") public owner!: string;
    @type("string") public sourceStarId!: string;
    @type("string") public destinationStarId!: string;
    @type("number") public ships!: number;
    @type("number") public startTime!: number;
    @type("number") public endTime!: number;
}
