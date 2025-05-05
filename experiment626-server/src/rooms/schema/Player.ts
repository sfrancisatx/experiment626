import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string;
  @type("string") name: string = "";
  @type("number") score: number = 0;
}
