"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const PlayerState_1 = require("./schema/PlayerState");
class Player extends PlayerState_1.PlayerState {
    constructor(state, id, name) {
        super();
        this.state = state;
        this.state.id = id;
        this.state.name = name;
    }
    getId() {
        return this.state.id;
    }
    getName() {
        return this.state.name;
    }
    setName(name) {
        this.state.name = name;
    }
}
exports.Player = Player;
