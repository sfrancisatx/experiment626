import { GalaxyState } from "./schema/GalaxyState";
import { Client, Room } from "@colyseus/core";
import { Star } from "./Star";
import { Fleet } from "./Fleet";
import { Empire } from "./Empire";
import { EmpireState } from "./schema/EmpireState";
import { FleetState } from "./schema/FleetState";

interface createOptions {
    vpId?: string;
    startingResearchPoints: number;
    startingSpeed: number;
    startingRange: number;
    startingBattlePower: number;
    startingWealth: number;
    startingStars: number;
    startingShips: number;
}

export class Galaxy extends Room<GalaxyState> {
    fleetList: Fleet[] = [];
    starList: Star[] = [];
    empireList: Empire[] = [];
    idCounter: number = 0;
    onCreate(options: createOptions) {
        this.state = new GalaxyState();
        this.state.startingResearchPoints = options.startingResearchPoints;
        this.state.startingSpeed = options.startingSpeed;
        this.state.startingRange = options.startingRange;
        this.state.startingBattlePower = options.startingBattlePower;
        this.state.startingWealth = options.startingWealth;
        this.state.startingStars = options.startingStars;
        this.state.startingShips = options.startingShips;
        //Must insantiate all player ids
        //Must instantiate all stars
        //
        this.onMessage("*", (client: Client, type: string | number, data: any) => {
            switch (type) {
                case "createFleet":
                    this.createFleet(data.sourceStarId, data.destinationStarId, data.ships, client.sessionId);
                    break;
                case "renameStar":
                    this.renameStar(data.id, data.name, client.sessionId);
                    break;
                case "destroyFleet":
                    this.destroyFleet(data.id);
                    break;
                default:
                    break;
            }
        });
        this.setSimulationInterval((deltaTime: number) => {
            this.state.clockTime += deltaTime;
            this.fleetList.forEach((fleet: Fleet) => {
                fleet.update(deltaTime);
            });
        });
    }
    distanceBetweenStars(sourceStarId: string, destinationStarId: string): number {
        var twoStars: Star[] = this.starList.filter((star: Star) => {
            if (star.getid() === sourceStarId || star.getid() === destinationStarId) {
                return true;
            }
            return false;
        });
        return Math.sqrt(Math.pow(twoStars[0].getX() - twoStars[1].getX(), 2) + Math.pow(twoStars[0].getY() - twoStars[1].getY(), 2));
    }
    fleetEndTimeCalculator(clockTime: number, distance: number, owner: string): number {
        var fleetEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === owner) {
                return true;
            }
            return false;
        });
        return distance / fleetEmpire.getSpeed()
    }
    createFleet(sourceStarId: string, destinationStarId: string, ships: number, owner: string) {
        this.fleetList.push(new Fleet(new FleetState(), this.idGenerator(), owner, sourceStarId, destinationStarId, ships, this.state.clockTime, this.fleetEndTimeCalculator(this.state.clockTime, this.distanceBetweenStars(sourceStarId, destinationStarId), owner)));
    }
    renameStar(id: string, name: string, owner: string) {
        this.starList.forEach((star: Star) => {
            if (star.getid() === id && star.getOwner() === owner) {
                star.setName(name);
            }
        });
    }
    destroyFleet(id: string) {
        this.fleetList = this.fleetList.filter((fleet: Fleet) => {
            return fleet.getid() !== id;
        });
    }
    idGenerator(): string {
        this.idCounter++;
        return this.idCounter.toString();
    }
    getFactoryCost(ownerId: string) {
        return 1;
    }
    getSpeedCost(ownerId: string) {
        return 1;
    }
    getRangeCost(ownerId: string) {
        return 1;
    }
    getBattlePowerCost(ownerId: string) {
        return 1;
    }
    onJoin(client: Client, empireName: string) {
        this.state.playerIdList.push(client.sessionId);
        this.empireList.push(new Empire(new EmpireState(), this.idGenerator(), empireName, client.sessionId, [], this.state.startingWealth, this.state.startingResearchPoints, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower));
    }
}
