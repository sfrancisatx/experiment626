import { Schema, type } from "@colyseus/schema";
import { GalaxyRoomState } from "./GalaxyRoomState";
import { Star } from "./Star";

export class Fleet extends Schema {
  
  @type("string") id: string;
  @type("string") owner: string; // Empire ID
  @type("number") ships: number;
  @type("number") speed: number;
  @type("number") range: number;
  @type("string") startingPoint: string; // Starting star ID
  @type("string") endPoint: string; // Destination star ID
  @type("number") x: number;
  @type("number") y: number;
  @type("number") eta: number; // Estimated time of arrival
  @type("boolean") isGarrisoned: boolean;
  @type("ref") galaxyState: any;

  constructor(id: string, owner: string, ships: number, speed: number, range: number, startingPoint: string, destination: string, galaxyState: GalaxyRoomState) {
    super();
    this.galaxyState = galaxyState;
    this.id = id;
    this.owner = owner;
    this.ships = ships;
    this.speed = speed;
    this.range = range;
    this.startingPoint = startingPoint;
    this.endPoint = destination;
    this.x = 0;
    this.y = 0;
    this.eta = 0;
    this.isGarrisoned = false;
  }

  updatePosition(currentTick: number, tickDuration: number): void {
    // Calculate movement based on speed and direction
    const destination = this.getDestination();
    if (!destination) return;

    // Don't move if garrisoned
    if (this.isGarrisoned) return;

    const distance = Math.sqrt(
      Math.pow(this.x - destination.x, 2) +
      Math.pow(this.y - destination.y, 2)
    );

    // Update position
    const angle = Math.atan2(destination.y - this.y, destination.x - this.x);
    this.x += Math.cos(angle) * this.speed * tickDuration;
    this.y += Math.sin(angle) * this.speed * tickDuration;

    // Update ETA
    this.updateETA(currentTick, tickDuration);
  }

  updateETA(currentTick: number, tickDuration: number): void {
    const destination = this.getDestination();
    if (!destination) return;

    const remainingDistance = Math.sqrt(
      Math.pow(destination.x - this.x, 2) +
      Math.pow(destination.y - this.y, 2)
    );

    const timeToArrive = remainingDistance / (this.speed * tickDuration);
    this.eta = currentTick + timeToArrive;
  }

  private getDestination(): Star | undefined {
    return this.galaxyState?.stars?.get(this.endPoint);
  }

  garrison(): void {
    this.isGarrisoned = true;
  }

  ungarrison(): void {
    this.isGarrisoned = false;
  }
} 