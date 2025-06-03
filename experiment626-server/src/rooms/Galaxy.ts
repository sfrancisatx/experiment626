import { GalaxyState } from "./schema/GalaxyState";
import { Client, Room } from "@colyseus/core";
import { Star } from "./Star";
import { StarState } from "./schema/StarState";
import { Player } from "./Player";

export class Galaxy extends Room<GalaxyState> {
    constructor() {
        super();
        this.state = new GalaxyState();
        this.onMessage("*", (client: Client, type: string | number, data: any) => {
            switch (type) {
                case "createStar":
                    this.state.starList.push(new Star(new StarState(), data.id, data.name, client.sessionId, data.x, data.y, data.wealthProduction, data.shipProduction, data.shipCount));
                    break;
                case "renameStar":
                    this.state.starList.forEach((star: Star) => {
                        if (star.getid() === data.id && star.getOwner() === client.sessionId) {
                            star.setName(data.name);
                        }
                    });
                case "":
                    break;
                default:
                    break;
            }
        });
    }
}