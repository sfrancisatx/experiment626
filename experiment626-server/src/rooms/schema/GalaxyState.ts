import { ArraySchema, Schema, type } from "@colyseus/schema";
import { Star } from "../Star";

export class GalaxyState extends Schema {

  @type("string") mySynchronizedProperty: string = "Hello world";
  @type(["Star"]) starList: ArraySchema<Star> = new ArraySchema<Star>();
}
