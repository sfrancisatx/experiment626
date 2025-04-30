import { Schema, type } from "@colyseus/schema";
import { Player } from "./Player";

export class MyRoomState extends Schema {

  @type(["map", Player]) players = new Map<string, Player>();
  @type("string") mySynchronizedProperty: string = "Hello world";

}
