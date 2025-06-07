import { Client, Room } from "@colyseus/core";
import { FleetState } from "./schema/FleetState";
import { Galaxy } from "./Galaxy";

export class Fleet extends Room<FleetState> {
    private galaxy: Galaxy;
    constructor(public state: FleetState, galaxy: Galaxy, id: string, owner: string, sourceStarId: string, destinationStarId: string, ships: number, startTime: number, endTime: number) {
        super();
        this.state.id = id;
        this.state.owner = owner;
        this.state.sourceStarId = sourceStarId;
        this.state.destinationStarId = destinationStarId;
        this.state.ships = ships;
        this.state.startTime = startTime;
        this.state.endTime = endTime;
        this.galaxy = galaxy;
    }
    update(deltaTime: number) {
        if (this.state.endTime <= this.state.startTime + deltaTime) {
            this.galaxy.fleetArrive(this);
        }
    }
    getId() {
        return this.state.id;
    }
    getOwner() {
        return this.state.owner;
    }
    getSourceStarId() {
        return this.state.sourceStarId;
    }
    getDestinationStarId() {
        return this.state.destinationStarId;
    }
    getShips() {
        return this.state.ships;
    }
    getStartTime() {
        return this.state.startTime;
    }
    getEndTime() {
        return this.state.endTime;
    }
}