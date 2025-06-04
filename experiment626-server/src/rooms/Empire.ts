import { EmpireState } from "./schema/EmpireState";
import { Room } from "@colyseus/core";

export class Empire extends Room<EmpireState> {
    constructor(public state: EmpireState, id: string, name: string, owner: string) {
        super();
        this.state.id = id;
        this.state.name = name;
        this.state.owner = owner;
    }
    getid() {
        return this.state.id;
    }
    getname() {
        return this.state.name;
    }
    getowner() {
        return this.state.owner;
    }
    setname(name: string) {
        this.state.name = name;
    }
    setowner(owner: string) {
        this.state.owner = owner;
    }
    
}