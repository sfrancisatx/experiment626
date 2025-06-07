"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fleet = void 0;
const core_1 = require("@colyseus/core");
class Fleet extends core_1.Room {
    constructor(state, galaxy, id, owner, sourceStarId, destinationStarId, ships, startTime, endTime) {
        super();
        this.state = state;
        this.state.id = id;
        this.state.owner = owner;
        this.state.sourceStarId = sourceStarId;
        this.state.destinationStarId = destinationStarId;
        this.state.ships = ships;
        this.state.startTime = startTime;
        this.state.endTime = endTime;
        this.galaxy = galaxy;
    }
    update(deltaTime) {
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
exports.Fleet = Fleet;
