// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 3.0.39
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, type DataChange } from '@colyseus/schema';
import { LobbyPlayer } from './LobbyPlayer'
import { GalaxySummary } from './GalaxySummary'

export class LobbyState extends Schema {
    @type({ map: LobbyPlayer }) public players: MapSchema<LobbyPlayer> = new MapSchema<LobbyPlayer>();
    @type([ GalaxySummary ]) public galaxies: ArraySchema<GalaxySummary> = new ArraySchema<GalaxySummary>();
}
