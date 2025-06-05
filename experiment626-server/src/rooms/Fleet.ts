import { Client, Room } from "@colyseus/core";
import { FleetState } from "./schema/FleetState";

export class Fleet extends Room<FleetState> {
    constructor(public state: FleetState, id: string, owner: string, sourceStarId: string, destinationStarId: string, ships: number, startTime: number, endTime: number) {
        super();
        this.state.id = id;
        this.state.owner = owner;
        this.state.sourceStarId = sourceStarId;
        this.state.destinationStarId = destinationStarId;
        this.state.ships = ships;
        this.state.startTime = startTime;
        this.state.endTime = endTime;
    }
    update(deltaTime: number) {
        
    }
    getid() {
        return this.state.id;
    }
    getowner() {
        return this.state.owner;
    }
    getsourceStarId() {
        return this.state.sourceStarId;
    }
    getdestinationStarId() {
        return this.state.destinationStarId;
    }
    getships() {
        return this.state.ships;
    }
    getstartTime() {
        return this.state.startTime;
    }
    getendTime() {
        return this.state.endTime;
    }
}