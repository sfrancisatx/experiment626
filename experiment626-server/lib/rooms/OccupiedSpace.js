"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccupiedSpace = void 0;
const core_1 = require("@colyseus/core");
class OccupiedSpace extends core_1.Room {
    constructor(state, x, y, type) {
        super();
        this.state = state;
        this.state.x = x;
        this.state.y = y;
        this.state.type = type;
        this.state.owner = "";
    }
    get getX() {
        return this.state.x;
    }
    get getY() {
        return this.state.y;
    }
    get getType() {
        return this.state.type;
    }
    getState() {
        return this.state;
    }
    get getOwner() {
        if (this.state.owner) {
            return this.state.owner;
        }
        return "";
    }
}
exports.OccupiedSpace = OccupiedSpace;
