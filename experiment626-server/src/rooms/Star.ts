import { StarState } from "./schema/StarState";

export class Star {
    constructor(public state: StarState, id: string, name: string, owner: string, x: number, y: number, wealthProduction: number, factoryCount: number, shipCount: number) {
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
    setName(name: string) {
        this.state.name = name;
    }
    setOwner(owner: string) {
        this.state.owner = owner;
    }
    setX(x: number) {
        this.state.x = x;
    }
    setY(y: number) {
        this.state.y = y;
    }
    setWealthProduction(wealthProduction: number) {
        this.state.wealthProduction = wealthProduction;
    }
    setFactoryCount(factoryCount: number) {
        this.state.factoryCount = factoryCount;
    }
    setShipCount(shipCount: number) {
        this.state.shipCount = shipCount;
    }
    toString(verbose: string = "false"): string {
        if (verbose === "true") {
            return "Name: " + this.state.name + "\n" + 
            "ID: " + this.state.id + "\n" +
            "Owner: " + this.state.owner + "\n" +
            "X: " + this.state.x + "\n" +
            "Y: " + this.state.y + "\n" +
            "Wealth Production: " + this.state.wealthProduction + "\n" +
            "Factory Count: " + this.state.factoryCount + "\n" +
            "Ship Count: " + this.state.shipCount;
        } else {
            return "Name: " + this.state.name + "\n" + 
            "ID: " + this.state.id + "\n" +
            "Owner: " + this.state.owner + "\n" +
            "X: " + this.state.x + "\n" +
            "Y: " + this.state.y;
        }
    }
}