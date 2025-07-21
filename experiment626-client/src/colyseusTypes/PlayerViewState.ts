// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.39
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, type DataChange } from '@colyseus/schema';
import { StarState } from './StarState';
import { FleetState } from './FleetState';

export class PlayerViewState extends Schema {
    @type("string") public sessionId!: string;
    @type([StarState]) public starList!: ArraySchema<StarState>;
    @type([FleetState]) public fleetList!: ArraySchema<FleetState>;
}
