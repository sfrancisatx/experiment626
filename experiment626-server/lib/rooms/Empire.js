"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Empire = void 0;
class Empire {
    constructor(state, id, name, ownerId, wealth, factoryCost, speed, range, battlePower, speedCost, rangeCost, battlePowerCost) {
        this.state = state;
        this.state.id = id;
        this.state.name = name;
        this.state.ownerId = ownerId;
        this.state.wealth = wealth;
        this.state.factoryCost = factoryCost;
        this.state.speed = speed;
        this.state.range = range;
        this.state.battlePower = battlePower;
        this.state.speedCost = speedCost;
        this.state.rangeCost = rangeCost;
        this.state.battlePowerCost = battlePowerCost;
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
    getWealth() {
        return this.state.wealth;
    }
    getFactoryCost() {
        return this.state.factoryCost;
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
    getSpeedCost() {
        return this.state.speedCost;
    }
    getRangeCost() {
        return this.state.rangeCost;
    }
    getBattlePowerCost() {
        return this.state.battlePowerCost;
    }
    setName(name) {
        this.state.name = name;
    }
    setOwnerId(ownerId) {
        this.state.ownerId = ownerId;
    }
    setWealth(wealth) {
        this.state.wealth = wealth;
    }
    setFactoryCost(factoryCost) {
        this.state.factoryCost = factoryCost;
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
    setSpeedCost(speedCost) {
        this.state.speedCost = speedCost;
    }
    setRangeCost(rangeCost) {
        this.state.rangeCost = rangeCost;
    }
    setBattlePowerCost(battlePowerCost) {
        this.state.battlePowerCost = battlePowerCost;
    }
    toString(verbose = "false") {
        if (verbose === "true") {
            return "Name: " + this.state.name + "\n" +
                "ID: " + this.state.id + "\n" +
                "Owner ID: " + this.state.ownerId + "\n" +
                "Wealth: " + this.state.wealth + "\n" +
                "Speed: " + this.state.speed + "\n" +
                "Range: " + this.state.range + "\n" +
                "Battle Power: " + this.state.battlePower;
        }
        else {
            return "Name: " + this.state.name + "\n" +
                "ID: " + this.state.id + "\n" +
                "Owner ID: " + this.state.ownerId;
        }
    }
}
exports.Empire = Empire;
