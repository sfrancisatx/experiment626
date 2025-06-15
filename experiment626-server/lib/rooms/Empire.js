"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Empire = void 0;
const core_1 = require("@colyseus/core");
class Empire extends core_1.Room {
    constructor(state, id, name, ownerId, starsOwned, wealth, researchPoints, speed, range, battlePower) {
        super();
        this.state = state;
        this.starsOwned = [];
        this.state.id = id;
        this.state.name = name;
        this.state.ownerId = ownerId;
        this.state.wealth = wealth;
        this.state.researchPoints = researchPoints;
        this.state.speed = speed;
        this.state.range = range;
        this.state.battlePower = battlePower;
        this.starsOwned = starsOwned;
    }
    getId() {
        return this.state.id;
    }
    getName() {
        return this.state.name;
    }
    getOwnerId() {
        return this.state.ownerId;
    }
    getStarsOwned() {
        var passingStarsOwned = this.starsOwned;
        return passingStarsOwned;
    }
    getWealth() {
        return this.state.wealth;
    }
    getResearchPoints() {
        return this.state.researchPoints;
    }
    getSpeed() {
        return this.state.speed;
    }
    getRange() {
        return this.state.range;
    }
    getBattlePower() {
        return this.state.battlePower;
    }
    setName(name) {
        this.state.name = name;
    }
    setOwnerId(ownerId) {
        this.state.ownerId = ownerId;
    }
    setStarsOwned(starsOwned) {
        var tempStarsOwned = starsOwned;
        this.starsOwned = tempStarsOwned;
    }
    setWealth(wealth) {
        this.state.wealth = wealth;
    }
    setResearchPoints(researchPoints) {
        this.state.researchPoints = researchPoints;
    }
    setSpeed(speed) {
        this.state.speed = speed;
    }
    setRange(range) {
        this.state.range = range;
    }
    setBattlePower(battlePower) {
        this.state.battlePower = battlePower;
    }
}
exports.Empire = Empire;
