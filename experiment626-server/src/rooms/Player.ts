import { PlayerState } from "./schema/PlayerState";

export class Player extends PlayerState {
    constructor(public state: PlayerState, id: string, name: string) {
        super();
        this.state.id = id;
        this.state.name = name;
    }
    getId() {
        return this.state.id;
    }
    getName() {
        return this.state.name;
    }
    setName(name: string) {
        this.state.name = name;
    }
}