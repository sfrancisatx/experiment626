"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Star = void 0;
class Star {
    constructor(state, id, name, owner, x, y, wealthProduction, factoryCount, shipCount) {
        this.state = state;
        this.state.id = id;
        this.state.name = name;
        this.state.owner = owner;
        this.state.x = x;
        this.state.y = y;
        this.state.wealthProduction = wealthProduction;
        this.state.factoryCount = factoryCount;
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
    getFactoryCount() {
        return this.state.factoryCount;
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
    setFactoryCount(factoryCount) {
        this.state.factoryCount = factoryCount;
    }
    setShipCount(shipCount) {
        this.state.shipCount = shipCount;
    }
    toString(verbose = "false") {
        if (verbose === "true") {
            return "Name: " + this.state.name + "\n" +
                "ID: " + this.state.id + "\n" +
                "Owner: " + this.state.owner + "\n" +
                "X: " + this.state.x + "\n" +
                "Y: " + this.state.y + "\n" +
                "Wealth Production: " + this.state.wealthProduction + "\n" +
                "Factory Count: " + this.state.factoryCount + "\n" +
                "Ship Count: " + this.state.shipCount;
        }
        else {
            return "Name: " + this.state.name + "\n" +
                "ID: " + this.state.id + "\n" +
                "Owner: " + this.state.owner + "\n" +
                "X: " + this.state.x + "\n" +
                "Y: " + this.state.y;
        }
    }
}
exports.Star = Star;
