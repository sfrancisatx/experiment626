import { GalaxyState } from "./schema/GalaxyState";
import { Client, Room } from "@colyseus/core";
import { Star } from "./Star";
import { Fleet } from "./Fleet";
import { Empire } from "./Empire";
import { EmpireState } from "./schema/EmpireState";
import { FleetState } from "./schema/FleetState";
import { StarState } from "./schema/StarState";

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
    ["small", 5000],
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
        this.state.startingResearchPoints = options.startingResearchPoints;
        this.state.startingSpeed = options.startingSpeed;
        this.state.startingRange = options.startingRange;
        this.state.startingBattlePower = options.startingBattlePower;
        this.state.startingWealth = options.startingWealth;
        this.state.startingStars = options.startingStars;
        this.state.startingShips = options.startingShips;
        this.state.id = options.id;
        this.state.size = options.size;
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
                    console.log(this.fleetList);
                    break;
                case "listStars":
                    console.log(this.starList);
                    break;
                case "listEmpires":
                    console.log(this.empireList);
                    break;
                case "listPlayers":
                    console.log(this.state.playerIdList);
                    break;
                case "listClockTime":
                    console.log(this.state.clockTime);
                    break;
                case "listVP":
                    console.log(this.state.vpId);
                    break;
                case "init":
                    this.initGalaxy(data.generationMethod);
                    break;
                default:
                    console.warn("Gibberish in the message " + type + " " + data);
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
    initGalaxy(generationMethod: string) {
        switch (generationMethod) {
            case "idk":
                break;
            default:
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error("Invalid galaxy size");
                    gsize = galaxySize.get("medium")!;
                }
                for (let i = 0; i < gsize/100; i++) {
                    var x: number = Math.round(Math.random() * gsize);
                    var y: number = Math.round(Math.random() * gsize);
                    var notTooClose: boolean = true;
                    for (let j = 0; j < this.starList.length; j++) {
                        var distance = Math.sqrt(Math.pow(x - this.starList[j].getX(), 2) + Math.pow(y - this.starList[j].getY(), 2));
                        if (distance < 100) {
                            notTooClose = false;
                        }
                    }
                    if (notTooClose) {
                        this.starList.push(new Star(new StarState(), this.idGenerator(), "Star " + this.starList.length, "", x, y, 100, 100, 0));
                    }
                }
                this.state.playerIdList.forEach((playerId: string) => {
                    var randomstar = this.starList[Math.round(Math.random() * this.starList.length)];
                    randomstar.setOwner(playerId);
                    this.empireList.find((empire: Empire) => {
                        if (empire.getOwnerId() === playerId) {
                            var newStarsOwned: Star[] = empire.getStarsOwned();
                            newStarsOwned.push(randomstar);
                            empire.setStarsOwned(newStarsOwned);
                        }
                    });
                });
                break;
        }
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
        return clockTime + distance / fleetEmpire.getSpeed()
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
                console.error("Defender Empire not found");
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
