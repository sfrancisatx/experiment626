import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class LobbyPlayer extends Schema {
  @type("string")
  name: string = "";
  @type("string")
  sessionId: string = "";
  @type("string") email: string = "";
}

export class GalaxySummary extends Schema {
  @type("string")
  roomId: string = "";
  @type("string")
  name: string = "";
  @type("string")
  status: string = "open"; // e.g. open, in-progress
  @type("number")
  playerCount: number = 0;
}

export class LobbyState extends Schema {
  @type({ map: LobbyPlayer })
  players = new MapSchema<LobbyPlayer>();

  @type([ GalaxySummary ])
  galaxies = new ArraySchema<GalaxySummary>();
}
