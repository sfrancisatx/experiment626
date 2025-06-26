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
    update(clockTime) {
        if (this.state.endTime <= clockTime) {
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
    toString(verbose = "false") {
        if (verbose === "true") {
            return "A Fleet in Space:\n" +
                "ID: " + this.state.id + "\n" +
                "Owner: " + this.state.owner + "\n" +
                "Source Star ID: " + this.state.sourceStarId + "\n" +
                "Destination Star ID: " + this.state.destinationStarId + "\n" +
                "Ships: " + this.state.ships + "\n" +
                "Start Time: " + this.state.startTime + "\n" +
                "End Time: " + this.state.endTime;
        }
        else {
            return "A Fleet in Space:\n" +
                "ID: " + this.state.id + "\n" +
                "Owner: " + this.state.owner + "\n" +
                "Source Star ID: " + this.state.sourceStarId + "\n" +
                "Destination Star ID: " + this.state.destinationStarId + "\n" +
                "Ships: " + this.state.ships;
        }
    }
}
exports.Fleet = Fleet;
