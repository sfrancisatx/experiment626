// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.39
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';


export class StarState extends Schema {
    @type("string") public id!: string;
    @type("string") public name!: string;
    @type("string") public owner!: string;
    @type("number") public x!: number;
    @type("number") public y!: number;
    @type("number") public wealthProduction!: number;
    @type("number") public factoryCount!: number;
    @type("number") public shipCount!: number;
}
