import { Schema, type } from "@colyseus/schema";
import { Star } from "../Star";
import { Fleet } from "../Fleet";
import { Empire } from "../Empire";

export class GalaxyState extends Schema {

  @type("number") clockTime: number = 0;
  @type("string") playerIdList: string[] = [];
  @type(Star) starList: Star[] = [];
  @type(Fleet) fleetList: Fleet[] = [];
  @type(Empire) empireList: Empire[] = [];
}
