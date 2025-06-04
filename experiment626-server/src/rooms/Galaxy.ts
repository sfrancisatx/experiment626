import { GalaxyState } from "./schema/GalaxyState";
import { Client, Room } from "@colyseus/core";
import { Star } from "./Star";
import { StarState } from "./schema/StarState";
import { FleetState } from "./schema/FleetState";
import { Fleet } from "./Fleet";

export class Galaxy extends Room<GalaxyState> {
    onCreate() {
        this.state = new GalaxyState();
        //Must insantiate all player ids
        //Must instantiate all stars
        //
        this.onMessage("*", (client: Client, type: string | number, data: any) => {
            switch (type) {
                case "createFleet":
                    this.state.fleetList.push(new Fleet(new FleetState(), data.id, data.owner, data.sourceStarId, data.destinationStarId, data.ships, this.state.clockTime, fleetEndTimeCalculator(this.state.clockTime, this.distanceBetweenStars(data.sourceStarId, data.destinationStarId), data.owner)));
                    break;
                case "renameStar":
                    this.state.starList.forEach((star: Star) => {
                        if (star.getid() === data.id && star.getOwner() === client.sessionId) {
                            star.setName(data.name);
                        }
                    });
                    break;
                case "removeStar":
                    this.state.starList = this.state.starList.filter((star: Star) => {
                        return star.getid() !== data.id;
                    });
                    break;
                default:
                    break;
            }
        });
        this.setSimulationInterval((deltaTime: number) => {
            this.state.clockTime += deltaTime;
            this.state.fleetList.forEach((fleet: Fleet) => {
                fleet.update(deltaTime);
            });
        });
    }
    distanceBetweenStars(sourceStarId: string, destinationStarId: string): number {
        //Implement
    }
}

function fleetEndTimeCalculator(clockTime: number, distance: number, owner: string): number {
    //Implement
}
