"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Star = void 0;
class Star {
    constructor(state, id, name, owner, x, y, wealthProduction, shipProduction, shipCount) {
        this.state = state;
        this.state.id = id;
        this.state.name = name;
        this.state.owner = owner;
        this.state.x = x;
        this.state.y = y;
        this.state.wealthProduction = wealthProduction;
        this.state.shipProduction = shipProduction;
        this.state.shipCount = shipCount;
    }
    getId() {
        return this.state.id;
    }
    getName() {
        return this.state.name;
    }
    getOwner() {
        return this.state.owner;
    }
    getX() {
        return this.state.x;
    }
    getY() {
        return this.state.y;
    }
    getWealthProduction() {
        return this.state.wealthProduction;
    }
    getShipProduction() {
        return this.state.shipProduction;
    }
    getShipCount() {
        return this.state.shipCount;
    }
    setName(name) {
        this.state.name = name;
    }
    setOwner(owner) {
        this.state.owner = owner;
    }
    setX(x) {
        this.state.x = x;
    }
    setY(y) {
        this.state.y = y;
    }
    setWealthProduction(wealthProduction) {
        this.state.wealthProduction = wealthProduction;
    }
    setShipProduction(shipProduction) {
        this.state.shipProduction = shipProduction;
    }
    setShipCount(shipCount) {
        this.state.shipCount = shipCount;
    }
}
exports.Star = Star;
