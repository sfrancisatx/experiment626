import { EmpireState } from "./schema/EmpireState";

export class Empire {
    constructor(public state: EmpireState, id: string, name: string, ownerId: string, wealth: number, factoryCost: number, speed: number, range: number, battlePower: number, speedCost: number, rangeCost: number, battlePowerCost: number) {
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
    setName(name: string) {
        this.state.name = name;
    }
    setOwnerId(ownerId: string) {
        this.state.ownerId = ownerId;
    }
    setWealth(wealth: number) {
        this.state.wealth = wealth;
    }
    setFactoryCost(factoryCost: number) {
        this.state.factoryCost = factoryCost;
    }
    setSpeed(speed: number) {
        this.state.speed = speed;
    }
    setRange(range: number) {
        this.state.range = range;
    }
    setBattlePower(battlePower: number) {
        this.state.battlePower = battlePower;
    }
    setSpeedCost(speedCost: number) {
        this.state.speedCost = speedCost;
    }
    setRangeCost(rangeCost: number) {
        this.state.rangeCost = rangeCost;
    }
    setBattlePowerCost(battlePowerCost: number) {
        this.state.battlePowerCost = battlePowerCost;
    }
    toString(verbose: string = "false"): string {
        if (verbose === "true") {
            return "Name: " + this.state.name + "\n" + 
            "ID: " + this.state.id + "\n" +
            "Owner ID: " + this.state.ownerId + "\n" +
            "Wealth: " + this.state.wealth + "\n" +
            "Speed: " + this.state.speed + "\n" +
            "Range: " + this.state.range + "\n" +
            "Battle Power: " + this.state.battlePower;
        } else {
            return "Name: " + this.state.name + "\n" + 
            "ID: " + this.state.id + "\n" +
            "Owner ID: " + this.state.ownerId;
        }
    }
}