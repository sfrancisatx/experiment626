import { GalaxyState } from "./schema/GalaxyState";
import { Client, Room } from "@colyseus/core";
import { Star } from "./Star";
import { Fleet } from "./Fleet";
import { Empire } from "./Empire";
import { EmpireState } from "./schema/EmpireState";
import { FleetState } from "./schema/FleetState";
import { StarState } from "./schema/StarState";
import { ArraySchema } from "@colyseus/schema";
import { OccupiedSpace } from "./OccupiedSpace";
import { OccupiedSpaceState } from "./schema/OccupiedSpaceState";

interface createOptions {
    vpId?: string;
    startingResearchPoints: number;
    startingSpeed: number;
    startingRange: number;
    startingBattlePower: number;
    startingWealth: number;
    startingStars: number;
    startingShips: number;
    id: string;
    size: string;
}

const galaxySize = new Map<string, number>([
    ["itty", 100],
    ["small", 1000],
    ["medium", 10000],
    ["large", 15000]
]);

export class Galaxy extends Room<GalaxyState> {
    fleetList: Fleet[] = [];
    starList: Star[] = [];
    empireList: Empire[] = [];
    idCounter: number = 0;
    onCreate(options: createOptions) {
        console.log("Galaxy created");
        this.state = new GalaxyState();
        this.state.startingResearchPoints = options.startingResearchPoints || 0;
        this.state.startingSpeed = options.startingSpeed || 1;
        this.state.startingRange = options.startingRange || 1000;
        this.state.startingBattlePower = options.startingBattlePower || 1;
        this.state.startingWealth = options.startingWealth || 1000;
        this.state.startingStars = options.startingStars || 1;
        this.state.startingShips = options.startingShips || 100;
        this.state.id = options.id;
        this.state.size = options.size;
        this.state.mapBlueprint = new ArraySchema<OccupiedSpaceState>();
        if (options.vpId) {
            this.state.vpId = options.vpId;
        }
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
                case "listFleets":
                    this.fleetList.forEach((fleet: Fleet) => {
                        console.log(fleet.toString(data.verbose));
                    });
                    break;
                case "listStars":
                    this.starList.forEach((star: Star) => {
                        console.log(star.toString(data.verbose));
                    });
                    break;
                case "listEmpires":
                    this.empireList.forEach((empire: Empire) => {
                        console.log(empire.toString(data.verbose));
                    });
                    break;
                case "listPlayers":
                    console.log(this.state.playerIdList);
                    break;
                case "listClockTime":
                    console.log(this.state.clockTime/1000);
                    break;
                case "listVP":
                    console.log(this.state.vpId);
                    break;
                case "init":
                    console.log("init " + this.state.clockTime/1000);
                    this.initGalaxy(data.generationMethod);
                    console.log("done init " + this.state.clockTime/1000);
                    break;
                case "printMap":
                    console.log("printMap " + this.state.clockTime/1000);
                    this.printMap();
                    console.log("done printMap " + this.state.clockTime/1000);
                    break;
                default:
                    console.warn("Gibberish in the message " + type + " " + data);
                    break;
            }
        });
        this.setSimulationInterval((deltaTime: number) => {
            this.state.clockTime += deltaTime;
            this.fleetList.forEach((fleet: Fleet) => {
                fleet.update(this.state.clockTime);
            });
            this.printMap();
        });
    }
    initGalaxy(generationMethod: string) {
        this.starList = [];
        switch (generationMethod) {
            case "test":
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error("Invalid galaxy size");
                    gsize = galaxySize.get("itty")!;
                    this.state.size = "itty";
                }
                for (let i = 10; i < gsize; i+= 10) {
                    for (let j = 10; j < gsize; j+= 10) {
                        this.starList.push(new Star(new StarState(), this.idGenerator(), "Star " + this.starList.length, "", j, i, 100, 100, 0));
                    }
                }
                this.assignCoreStars();
                break;
            default:
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error("Invalid galaxy size");
                    gsize = galaxySize.get("itty")!;
                    this.state.size = "itty";
                }
                for (let i = 0; i < gsize/10; i++) {
                    var x: number = Math.round(Math.random() * gsize);
                    var y: number = Math.round(Math.random() * gsize);
                    var notTooClose: boolean = true;
                    for (let j = 0; j < this.starList.length; j++) {
                        var distance = Math.sqrt(Math.pow(x - this.starList[j].getX(), 2) + Math.pow(y - this.starList[j].getY(), 2));
                        if (distance < 5) {
                            notTooClose = false;
                            i--;
                        }
                    }
                    if (notTooClose) {
                        this.starList.push(new Star(new StarState(), this.idGenerator(), "Star " + this.starList.length, "", x, y, 100, 100, 0));
                    }
                }
                this.assignCoreStars();
                break;
        }
    }
    printMap() {
        this.state.mapBlueprint.clear();
        this.starList.forEach((star: Star) => {
            const occupiedSpaceState = new OccupiedSpaceState();
            occupiedSpaceState.x = star.getX();
            occupiedSpaceState.y = star.getY();
            occupiedSpaceState.type = "s";
            if (isNaN(occupiedSpaceState.x) || isNaN(occupiedSpaceState.y)) {
                console.error("❌ NaN found! " + star.getX() + "," + star.getY());
              }
            this.state.mapBlueprint.push(occupiedSpaceState);
        });
        this.fleetList.forEach((fleet: Fleet) => {
            var coords = this.approximateCoordinates(fleet);
            const occupiedSpaceState = new OccupiedSpaceState();
            occupiedSpaceState.x = coords.x;
            occupiedSpaceState.y = coords.y;
            occupiedSpaceState.type = "f";
            if (isNaN(occupiedSpaceState.x) || isNaN(occupiedSpaceState.y)) {
                console.error("❌ NaN found! " + coords.x + "," + coords.y);
              }
            this.state.mapBlueprint.push(occupiedSpaceState);
        });

    }
    approximateCoordinates(fleet: Fleet): {x: number, y: number} {
        var x: number = -1;
        var y: number = -1;
        var percentDone = (this.state.clockTime - fleet.getStartTime()) / (fleet.getEndTime() - fleet.getStartTime());
        var sourceStar = this.starList.find((star: Star) => {
            if (star.getId() === fleet.getSourceStarId()) {
                return true;
            }
            return false;
        });
        var destinationStar = this.starList.find((star: Star) => {
            if (star.getId() === fleet.getDestinationStarId()) {
                return true;
            }
            return false;
        });
        if (!sourceStar || !destinationStar) {
            console.error("Source or destination star not found");
            return {x: x, y: y};
        }
        x = Math.round(sourceStar.getX() + (destinationStar.getX() - sourceStar.getX()) * percentDone);
        y = Math.round(sourceStar.getY() + (destinationStar.getY() - sourceStar.getY()) * percentDone);
        return {x: x, y: y};
    }
    assignCoreStars() {
        this.state.playerIdList.forEach((playerId: string) => {
            var foundStar: boolean = false;
            while (foundStar === false) {
                var randomstar = this.starList[Math.floor(Math.random() * this.starList.length)];
                if (!randomstar) {
                    console.error("Random star not found");
                    break;
                }
                if (!randomstar.getOwner()) {
                    foundStar = true;
                    randomstar.setOwner(playerId);
                    this.empireList.find((empire: Empire) => {
                        if (empire.getOwnerId() === playerId) {
                            var newStarsOwned: Star[] = empire.getStarsOwned();
                            newStarsOwned.push(randomstar);
                            empire.setStarsOwned(newStarsOwned);
                        }
                    });
                }
            }
        });
    }
    distanceBetweenStars(sourceStarId: string, destinationStarId: string): number {
        var twoStars: Star[] = this.starList.filter((star: Star) => {
            if (star.getId() === sourceStarId || star.getId() === destinationStarId) {
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
        if (!fleetEmpire) {
            console.error("Empire of Fleet not found");
            return clockTime + distance;
        }
        return clockTime + distance*1000 / fleetEmpire.getSpeed();
    }
    createFleet(sourceStarId: string, destinationStarId: string, ships: number, owner: string) {
        this.fleetList.push(new Fleet(new FleetState(), this, this.idGenerator(), owner, sourceStarId, destinationStarId, ships, this.state.clockTime, this.fleetEndTimeCalculator(this.state.clockTime, this.distanceBetweenStars(sourceStarId, destinationStarId), owner)));
    }
    renameStar(id: string, name: string, owner: string) {
        this.starList.forEach((star: Star) => {
            if (star.getId() === id && star.getOwner() === owner) {
                star.setName(name);
            }
        });
    }
    destroyFleet(id: string) {
        this.fleetList = this.fleetList.filter((fleet: Fleet) => {
            return fleet.getId() !== id;
        });
    }
    fleetArrive(fleet: Fleet) {
        var star = this.starList.find((star2: Star) => {
            return star2.getId() === fleet.getDestinationStarId();
        });
        if (!(star instanceof Star)) {
            console.error("Star of Fleet Destination not found");
            return;
        }
        if (star.getOwner() === fleet.getOwner()) {
            star.setShipCount(star.getShipCount() + fleet.getShips());
            this.destroyFleet(fleet.getId());
        }
        else {
            //Battle
            var defenders = this.empireList.find((empire: Empire) => {
                if (!star) {
                    console.error("Star of Fleet Destination not found");
                    return false;
                }
                return empire.getOwnerId() === star.getOwner();
            })
            if (!defenders) {
                star.setShipCount(fleet.getShips());
                this.destroyFleet(fleet.getId());
                star.setOwner(fleet.getOwner());
                return;
            }
            var defendersBattlePower = defenders.getBattlePower();
            var attackers = this.empireList.find((empire: Empire) => {
                return empire.getOwnerId() === fleet.getOwner();
            })
            if (!attackers) {
                console.error("Attacker Empire not found");
                return;
            }
            var attackersBattlePower = attackers.getBattlePower();
            var defenderShips: number = star.getShipCount();
            var attackerShips: number = fleet.getShips();
            var difference: number = defenderShips * (1 + defendersBattlePower/10) - attackerShips * (1 + attackersBattlePower/10);
            var defenderWin: boolean = difference >= 0;
            var upsetChance: number;
            if (Math.abs(difference) > 1000) {
                upsetChance = 0;
            }
            else if (Math.abs(difference) > 800) {
                upsetChance = 1;
            }
            else if (Math.abs(difference) > 600) {
                upsetChance = 2;
            }
            else if (Math.abs(difference) > 400) {
                upsetChance = 3;
            }
            else if (Math.abs(difference) > 200) {
                upsetChance = 4;
            }
            else if (Math.abs(difference) > 100) {
                upsetChance = 5;
            }
            else if (Math.abs(difference) > 50) {
                upsetChance = 10;
            }
            else if (Math.abs(difference) > 10) {
                upsetChance = 20;
            }
            else {
                upsetChance = 40;
            }
            if (defenderWin) {upsetChance -= 2.5}
            if (Math.random() * 100 <= upsetChance) {
                defenderWin = !defenderWin;
            }
            var randomizedOutcome: number = Math.random() * 10;
            if (Math.random() >= 0.5) {
                randomizedOutcome = randomizedOutcome * -1;
            }
            if (defenderWin) {
                star.setShipCount((defenderShips - attackerShips * (1 + defendersBattlePower/10 - attackersBattlePower/10)) + randomizedOutcome);
                this.destroyFleet(fleet.getId());
            }
            else {
                star.setOwner(fleet.getOwner());
                star.setShipCount((attackerShips - defenderShips * (1 + attackersBattlePower/10 - defendersBattlePower/10)) + randomizedOutcome);
                this.destroyFleet(fleet.getId());
            }
        }
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
    getId(): string {
        return this.state.id;
    }
    onJoin(client: Client, options: {empireName: string}) {
        this.state.playerIdList.push(client.sessionId);
        if (options.empireName) {
            this.empireList.push(new Empire(new EmpireState(), this.idGenerator(), options.empireName, client.sessionId, [], this.state.startingWealth, this.state.startingResearchPoints, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower));
        }
        else {
            console.error("No empire name provided");
            this.empireList.push(new Empire(new EmpireState(), this.idGenerator(), "Default Empire Name Resolve Failure", client.sessionId, [], this.state.startingWealth, this.state.startingResearchPoints, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower));
        }
    }
}
