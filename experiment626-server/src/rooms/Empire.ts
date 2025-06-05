import { EmpireState } from "./schema/EmpireState";
import { Room } from "@colyseus/core";
import { Star } from "./Star";

export class Empire extends Room<EmpireState> {
    starsOwned: Star[] = [];
    constructor(public state: EmpireState, id: string, name: string, ownerId: string, starsOwned: Star[], wealth: number, researchPoints: number, speed: number, range: number, battlePower: number) {
        super();
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
        return this.starsOwned;
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
    setName(name: string) {
        this.state.name = name;
    }
    setOwnerId(ownerId: string) {
        this.state.ownerId = ownerId;
    }
    setWealth(wealth: number) {
        this.state.wealth = wealth;
    }
    setResearchPoints(researchPoints: number) {
        this.state.researchPoints = researchPoints;
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
}