// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.39
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';


export class GalaxySummary extends Schema {
    @type("string") public roomId!: string;
    @type("string") public name!: string;
    @type("string") public status!: string;
    @type("number") public playerCount!: number;
}
