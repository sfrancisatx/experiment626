import { OccupiedSpaceState } from "./schema/OccupiedSpaceState";

export class OccupiedSpace {
    constructor(public state: OccupiedSpaceState, x: number, y: number, type: string) {
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