import { GalaxyState } from "./schema/GalaxyState";
import { Client, Room } from "@colyseus/core";
import { Star } from "./Star";
import { Fleet } from "./Fleet";
import { Empire } from "./Empire";
import { EmpireState } from "./schema/EmpireState";
import { FleetState } from "./schema/FleetState";
import { StarState } from "./schema/StarState";
import { ArraySchema } from "@colyseus/schema";
import { PlayerViewState } from "./schema/PlayerViewState";
import { verifyIdToken } from "../firebase-admin";
import { upsertUser, getOrCreateGameAssociation, getGameAssociation, markUserDisconnected } from "../services/userService";

interface createOptions {
    vpId?: string;
    startingSpeed: number;
    startingRange: number;
    startingBattlePower: number;
    startingWealth: number;
    startingStars: number;
    startingShips: number;
    factoryCost: number;
    startingSpeedCost: number;
    startingRangeCost: number;
    startingBattlePowerCost: number;
    id: string;
    galaxyName?: string;
    size: string;
    visibilityLevel: number;
    minimumDistanceBetweenStars: number;
}

const gridUnitsPerLightYear = 1;
const hoursPerTurn = 1/6; //0.008333333333 = 1 turn every 30 seconds 0.002777777778 = 1 turn every 10 seconds 0.0002777777778 = 1 turn every second
const startingRange = 10000;

const galaxySize = new Map<string, number>([
    ["itty", 100],
    ["small", 1000],
    ["medium", 10000],
    ["large", 15000]
]);

export class Galaxy extends Room<GalaxyState> {
    autoDispose = false; // Keep room alive even when all players leave
    
    fleetList: Map<string, Fleet> = new Map<string, Fleet>(); //Fleet ID -> Fleet
    starList: Map<string, Star> = new Map<string, Star>(); //Star ID -> Star
    empireList: Map<string, Empire> = new Map<string, Empire>(); //Empire ID -> Empire
    playerToEmpireList: Map<string, string> = new Map<string, string>(); //Player ID (sessionId) -> Empire ID
    userIdToEmpireList: Map<string, string> = new Map<string, string>(); //Firebase User ID -> Empire ID
    clientToUserMap: Map<string, string> = new Map<string, string>(); //Client sessionId -> Firebase User ID
    idCounter: number = 0;
    skipToNextTurn: boolean = false;
    nextTurnTime: number = Number.MAX_SAFE_INTEGER;
    nextUITime: number = 2000;
    playerViewStateList: Map<string, PlayerViewState> = new Map<string, PlayerViewState>(); //Client ID -> PlayerViewState
    starVisibilityMap: Map<string, string[]> = new Map<string, string[]>(); //Empire ID -> Star ID[]
    onCreate(options: createOptions) {
        console.log("Galaxy created");
        this.state = new GalaxyState();
        this.state.startingSpeed = options.startingSpeed || 1;
        this.state.startingRange = options.startingRange || startingRange;
        this.state.startingBattlePower = options.startingBattlePower || 1;
        this.state.startingWealth = options.startingWealth || 1000;
        this.state.startingStars = options.startingStars || 1;
        this.state.startingShips = options.startingShips || 100;
        this.state.factoryCost = options.factoryCost || 1;
        this.state.startingSpeedCost = options.startingSpeedCost || 1;
        this.state.startingRangeCost = options.startingRangeCost || 1;
        this.state.startingBattlePowerCost = options.startingBattlePowerCost || 1;
        this.state.id = options.id;
        this.state.galaxyName = options.galaxyName || "Unnamed Galaxy";
        this.state.size = options.size;
        this.state.visibilityLevel = options.visibilityLevel || 1;
        this.state.minimumDistanceBetweenStars = options.minimumDistanceBetweenStars || 5;
        this.nextUITime = this.state.clockTime + 2000;
        
        // Set room metadata so Lobby can display the galaxy name
        this.setMetadata({ galaxyName: this.state.galaxyName });
        if (options.vpId) {
            this.state.vpId = options.vpId;
        }
        this.nextTurnTime = this.state.clockTime + hoursPerTurn * 60 * 60 * 1000;
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
                    const empireId = this.playerToEmpireList.get(client.sessionId);
                    if (!empireId) {
                        console.error(`Empire not found while Client Requesting to printMap\nClient ID: ${client.sessionId}\nLocation: Galaxy.printMap`);
                        break;
                    }
                    this.genStarVisibilityMap(empireId);
                    this.genPlayerStarView(client.sessionId);
                    this.genPlayerFleetView(client.sessionId);
                    console.log("done printMap " + this.state.clockTime/1000);
                    break;
                case "sendFleet":
                    this.sendFleet(data.sourceStarId, data.destinationStarId, data.ships, client.sessionId);
                    break;
                case "buildFactory":
                    this.buildFactory(data.starId, client.sessionId);
                    break;
                case "upgradeSpeed":
                    this.upgradeSpeed(client.sessionId);
                    break;
                case "upgradeRange":
                    this.upgradeRange(client.sessionId);
                    break;
                case "upgradeBattlePower":
                    this.upgradeBattlePower(client.sessionId);
                    break;
                case "sendWealth":
                    this.sendWealth(data.amount, client.sessionId, data.targetId);
                    break;
                case "nextTurn":
                    this.skipToNextTurn = true;
                    break;
                case "listStarsInRange":
                    this.listStarsInRange(data.starId, client.sessionId).forEach((star: Star) => {
                        console.log(star.toString());
                    });
                    break;
                case "addClockTime":
                    this.state.clockTime += data.amount;
                    break;
                case "listDebugInfo":
                    this.sendDebugInfo(client.sessionId);
                    break;
                case "listStarVisibilityMap":
                    console.log(this.starVisibilityMap);
                    break;
                case "listPlayersStarView":
                    this.playerViewStateList.forEach((playerViewState: PlayerViewState) => {
                        console.log(`Player ID: ${playerViewState.sessionId}`);
                        playerViewState.starList.forEach((star: StarState) => {
                            console.log(`Star ID: ${star.id}\nOwner ID: ${star.owner}\nName: ${star.name}\nCoordinates: ${star.x}, ${star.y}\nWealth Production: ${star.wealthProduction}\nFactory Count: ${star.factoryCount}\nShip Count: ${star.shipCount}\nLocation: Galaxy.listPlayersStarView`);
                        });
                    });
                    break;
                case "listPlayersFleetView":
                    this.playerViewStateList.forEach((playerViewState: PlayerViewState) => {
                        console.log(playerViewState.fleetList);
                    });
                    break;
                default:
                    console.warn(`Unrecognized Command: ${type}\n Data: ${data}\n Location: Galaxy.onMessage`);
                    break;
            }
        });
        this.setSimulationInterval((deltaTime: number) => {
            this.state.clockTime += deltaTime;
            if (this.skipToNextTurn) {
                this.skipToNextTurn = false;
                this.state.clockTime += (hoursPerTurn * 60 * 60 * 1000) - (this.state.clockTime % (hoursPerTurn * 60 * 60 * 1000));
            }
            this.fleetList.forEach((fleet: Fleet) => {
                fleet.update(this.state.clockTime);
            });
            while (this.state.clockTime >= this.nextUITime) {
                this.clients.forEach((client: Client) => {
                    this.sendDebugInfo(client.sessionId);
                });
                this.nextUITime += 1 * 1000;
            }
            while (this.state.clockTime >= this.nextTurnTime) {
                this.turn();
                console.log(`Turn at ${this.state.clockTime / 1000}`);
                this.nextTurnTime += hoursPerTurn * 60 * 60 * 1000;
            }
            this.clients.forEach((client: Client) => {
                this.genPlayerFleetView(client.sessionId);
            });
        });
    }
    turn() {
        // Allocating the new ships to stars
        this.starList.forEach((star: Star) => {
            if (star.state.factoryCount > 0) {
                star.state.shipCount += star.state.factoryCount;
                this.updatePlayersStarView("shipCountChange", {starId: star.state.id, shipCount: star.state.shipCount});
            }
        });
        // Generating wealth for each empire
        this.empireList.forEach((empire: Empire) => {
            var starsOwned: Star[] = [];
            this.starList.forEach((star: Star) => {
                if (star.state.owner === empire.state.id) {
                    starsOwned.push(star);
                }
            });
            var wealthGenerated = 0;
            starsOwned.forEach((star: Star) => {
                wealthGenerated += star.state.wealthProduction;
            });
            empire.state.wealth += wealthGenerated;
        });
    }
    initGalaxy(generationMethod: string) {
        this.starList = new Map<string, Star>();
        switch (generationMethod) {
            case "test":
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error(`Invalid galaxy size: ${this.state.size}\n Location: Galaxy.initGalaxy(), 1`);
                    gsize = galaxySize.get("itty")!;
                    this.state.size = "itty";
                }
                for (let i = 10; i < gsize; i+= 10) {
                    for (let j = 10; j < gsize; j+= 10) {
                        const id = this.idGenerator();
                        this.starList.set(id, new Star(new StarState(), id, "Star " + this.starList.size, "", j, i, 100, 0, 0));
                    }
                }
                break;
            default:
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error(`Invalid galaxy size: ${this.state.size}\n Location: Galaxy.initGalaxy(), 2`);
                    gsize = galaxySize.get("small")!;
                    this.state.size = "small";
                }
                for (let i = 0; i < gsize/5; i++) {
                    var x: number = Math.round(Math.random() * gsize);
                    var y: number = Math.round(Math.random() * gsize);
                    var notTooClose: boolean = true;
                    this.starList.forEach((star: Star) => {
                        const distance = Math.sqrt(Math.pow(x - star.state.x, 2) + Math.pow(y - star.state.y, 2));
                        if (distance < this.state.minimumDistanceBetweenStars) {
                            notTooClose = false;
                        }
                    });
                    if (notTooClose) {
                        const id = this.idGenerator();
                        this.starList.set(id, new Star(new StarState(), id, "Star " + this.starList.size, "", x, y, 100, 0, 0));
                    }
                }
                break;
        }
        this.assignCoreStars();
        this.genStarVisibilityMap();
        this.playerViewStateList.forEach((playerViewState: PlayerViewState) => {
            this.genPlayerStarView(playerViewState.sessionId);
            this.genPlayerFleetView(playerViewState.sessionId);
            this.clients.getById(playerViewState.sessionId)?.send("playerViewState", playerViewState);
        });
        this.nextTurnTime = hoursPerTurn * 60 * 60 * 1000 + this.state.clockTime;
    }
    genStarVisibilityMap(empireId?: string) {
        if (!empireId) {
            this.starVisibilityMap.clear();
            this.starList.forEach((star: Star) => {
                if (star.state.owner !== "") {
                    if (!this.starVisibilityMap.has(star.state.owner)) {
                        this.starVisibilityMap.set(star.state.owner, [star.state.id]);
                    }
                    const playerOfEmpire = this.empireList.get(star.state.owner)?.state.ownerId;
                    if (!playerOfEmpire) {
                        let empList = "";
                        this.empireList.forEach((value, key) => {
                            empList += `${key}: ${value}\n`
                        });
                        console.error(`Player ID not found\nEmpire ID: ${star.state.owner}\nEmpire: ${this.empireList.get(star.state.owner)}\nEmpire Owner: ${this.empireList.get(star.state.owner)?.state.ownerId}\nEmpire List: ${empList}\nPlayer List: ${this.state.playerIdList}\nStar Visibility Map: ${this.starVisibilityMap}\nLocation: Galaxy.genStarVisibilityMap()`);
                        return;
                    }
                    const starsInRange = this.listStarsInRange(star.state.id, playerOfEmpire);
                    starsInRange.forEach((neighboringStar: Star) => {
                        if (neighboringStar.state.owner !== star.state.owner) {
                            this.starVisibilityMap.get(star.state.owner)!.push(neighboringStar.state.id);
                        }
                    });
                }
            });
        }
        else {
            let empireStars = this.starVisibilityMap.get(empireId)
            if (!empireStars) {
                console.error(`Empire entry not found\nstarVisibilityMap: ${this.starVisibilityMap}\nEmpire ID: ${empireId}\nLocation: Galaxy.genStarVisibilityMap()`);
                return
            }
            empireStars = [];
            this.starList.forEach((star: Star) => {
                if (star.state.owner === empireId) {
                    empireStars.push(star.state.id);
                    const playerOfEmpire = this.empireList.get(empireId)?.state.ownerId;
                    if (!playerOfEmpire) {
                        console.error(`Player ID not found\nEmpire ID: ${empireId}\nPlayer List: ${this.state.playerIdList}\nLocation: Galaxy.genStarVisibilityMap()`);
                        return;
                    }
                    const starsInRange = this.listStarsInRange(star.state.id, playerOfEmpire);
                    starsInRange.forEach((neighboringStar: Star) => {
                        if (neighboringStar.state.owner !== empireId) {
                            empireStars.push(neighboringStar.state.id);
                        }
                    });
                }
            });
            this.starVisibilityMap.set(empireId, empireStars);//Possibly Redundant?
        }
    }
    genPlayerFleetView(clientId: string) {
        
        let playerViewState = this.playerViewStateList.get(clientId);
        if (!playerViewState) {
            console.error(`Player view state not found\nClient ID: ${clientId}\n Location: Galaxy.updateMap()`);
            return;
        }
        let empireId = this.playerToEmpireList.get(clientId);
        if (!empireId) {
            console.error(`Empire ID not found\nClient ID: ${clientId}\n Location: Galaxy.updateMap()`);
            return;
        }
        let empire = this.empireList.get(empireId);
        if (!empire) {
            console.error(`Empire not found\nClient ID: ${clientId}\n Location: Galaxy.updateMap()`);
            return;
        }
        let fleets: Fleet[] = [];
        this.fleetList.forEach((fleet: Fleet) => {
            if (fleet.state.owner === empire.state.id) {
                fleets.push(fleet);
            }
        });
        
        playerViewState.fleetList.clear();
        fleets.forEach((fleet: Fleet) => {
            playerViewState.fleetList.push(fleet.state);
        });
        this.clients.getById(clientId)?.send("playerViewState", playerViewState);
    }
    genPlayerStarView(clientId: string) {
        let playerViewState = this.playerViewStateList.get(clientId);
        if (!playerViewState) {
            console.error(`Player view state not found\nClient ID: ${clientId}\n Location: Galaxy.updateMap()`);
            return;
        }
        let empireId = this.playerToEmpireList.get(clientId);
        if (!empireId) {
            console.error(`Empire ID not found\nClient ID: ${clientId}\n Location: Galaxy.updateMap()`);
            return;
        }
        let empire = this.empireList.get(empireId);
        if (!empire) {
            console.error(`Empire not found\nClient ID: ${clientId}\n Location: Galaxy.updateMap()`);
            return;
        } // End of Retreiving variables; Actual Logic Below
        switch (this.state.visibilityLevel) {
            case 1:
                playerViewState.starList.clear();
                if (this.starVisibilityMap.has(empire.state.id)) {
                    this.starVisibilityMap.get(empire.state.id)!.forEach((starId: string) => {
                        let star = this.starList.get(starId);
                        if (!star) {
                            console.error(`Star not found\nStar ID: ${starId}\nStar List: ${this.starList}\n Location: Galaxy.genPlayerStarView()`);
                            return;
                        }
                        if (star.state.owner === empire.state.id) {
                            const starState = new StarState
                            starState.id = star.state.id;
                            starState.name = star.state.name;
                            starState.owner = empire.state.name;
                            starState.x = star.state.x;
                            starState.y = star.state.y;
                            starState.wealthProduction = star.state.wealthProduction;
                            starState.factoryCount = star.state.factoryCount;
                            starState.shipCount = star.state.shipCount;
                            playerViewState.starList.push(starState);
                        } else {
                            const starState = new StarState
                            starState.id = star.state.id;
                            starState.name = star.state.name;
                            if (star.state.owner === "") {
                                starState.owner = "None";
                            } else {
                                let nameOfOwner = this.empireList.get(star.state.owner)?.state.name
                                if (!nameOfOwner) {
                                    console.error(`Empire not found\nEmpire ID Provided: ${star.state.owner}\nEmpire List: ${this.empireList}\nStar: ${star.toString("true")}\nLocation: Galaxy.genPlayerStarView()`);
                                    nameOfOwner = "Unknown";
                                }
                                starState.owner = nameOfOwner;
                            }
                            starState.x = star.state.x;
                            starState.y = star.state.y;
                            starState.wealthProduction = -1;
                            starState.factoryCount = -1;
                            starState.shipCount = -1;
                            playerViewState.starList.push(starState);
                        }
                    });
                } else {
                    console.error(`Star visibility map not found\nEmpire ID: ${empire.state.id}\nStar Visibility Map: ${this.starVisibilityMap}\n Location: Galaxy.genPlayerStarView()`);
                }
                break;
            default:
                console.log(`Visibility level ${this.state.visibilityLevel} not implemented`);
                break;
        }
        this.clients.getById(clientId)?.send("playerViewState", playerViewState);
    }
    updatePlayersStarView(change: string, data: any) { //STILL NEEDS WORK in other methods/places to make sure it calls this
        /*
        updatePlayersStarView is not supposed to responsible to updating the master StarList
        It is not expected to do that for anything other than the starVisibilityMap and playerViewStateList
        playerViewStateList is updated either in this method if it is a simple change or this method
        will update the starVisibilityMap and call genPlayerStarView to update the playerViewStateList
        for specifically only the players who see the given star.
        */
        switch (change) {
            case "capture":
                let attacker = this.empireList.get(data.attackerId);
                let defender: Empire | undefined;
                if (!data.unowned) {
                    defender = this.empireList.get(data.defenderId);
                }
                if (!attacker) {
                    console.error(`Attacker Empire not found\nAttacker ID: ${data.attackerId}\nDefender ID: ${data.defenderId}\nLocation: Galaxy.updatePlayersStarView()`);
                    return;
                }
                if (!defender && !data.unowned) {
                    console.error(`Defender Empire not found\nAttacker ID: ${data.attackerId}\nDefender ID: ${data.defenderId}\nLocation: Galaxy.updatePlayersStarView()`);
                    return;
                }
                let attackerVis = this.starVisibilityMap.get(attacker.state.id);
                let defenderVis: string[] | undefined;
                if (defender) {
                    defenderVis = this.starVisibilityMap.get(defender.state.id);
                }
                if (!attackerVis) {
                    this.starVisibilityMap.set(attacker.state.id, [data.starId]);
                    attackerVis = this.starVisibilityMap.get(attacker.state.id)!;
                }
                this.listStarsInRange(data.starId, attacker.state.ownerId).forEach((star: Star) => {
                    if (!attackerVis.includes(star.state.id)) {
                        attackerVis.push(star.state.id);
                    }
                });
                this.genPlayerStarView(attacker.state.ownerId);
                //We haven't touched the defender's visibility map during the battle unfolding process yet, so the vis map still thinks the defender owns this. So if this doesn't exist something is wrong with making sure owned stars are on their owner's list in the vis map.
                if (defender) {
                    this.listStarsInRange(data.starId, defender.state.ownerId).forEach((star: Star) => {
                        let lineage = false;
                        this.listStarsInRange(star.state.id, defender.state.ownerId).some(degree2SepStar => 
                            degree2SepStar.state.owner === defender.state.id);
                        if (!lineage) {
                            defenderVis = defenderVis!.filter((starId: string) => {
                                if (starId !== star.state.id) {
                                    return true;
                                }
                                return false;
                            });
                        }
                    });
                    this.genPlayerStarView(defender.state.ownerId);
                }
                break;
            case "destroy":
                this.playerViewStateList.forEach((playerViewState: PlayerViewState) => {
                    let newStarList = playerViewState.starList.filter((star: StarState) => {
                        if (star.id === data.starId) {
                            return false;
                        }
                        return true;
                    });
                    playerViewState.starList.clear();
                    playerViewState.starList.push(...newStarList);
                });
                this.starVisibilityMap.forEach((value: string[], key: string) => {
                    if (value.includes(data.starId)) {
                        this.starVisibilityMap.get(key)!.splice(value.indexOf(data.starId), 1);
                    }
                });
                break;
            case "rename":
                if (!this.starList.has(data.starId)) {
                    console.error(`Star ${data.starId} not found in Star List ${this.starList}\nTrying to rename star`);
                    return;
                }
                if (data.empireId !== this.starList.get(data.starId)!.state.owner) {
                    console.error(`Empire ${data.empireId} does not own star ${data.starId}\nTrying to rename star`);
                    return;
                }
                this.playerViewStateList.forEach((playerViewState: PlayerViewState) => {
                    playerViewState.starList.forEach((state: StarState) => {
                        if (state.id === data.starId && state.name !== "???") {
                            state.name = data.name;
                        }
                    });
                });
                break;
            case "rangeChange":
                this.genStarVisibilityMap(data.empireId);
                this.genPlayerStarView(data.clientId);
                break;
            case "shipCountChange":
                this.playerViewStateList.forEach((playerViewState: PlayerViewState) => {
                    playerViewState.starList.forEach((star: StarState) => {
                        if (star.id === data.starId && star.shipCount !== -1) {
                            star.shipCount = data.shipCount;
                        }
                    });
                });
                break;
            case "positionChange":
                this.genStarVisibilityMap();
                this.state.playerIdList.forEach((playerId: string) => {
                    this.genPlayerStarView(playerId);
                });
                break;
            default:
                console.log(`Update type unknown or not implemented: ${change}\nData: ${data}`);
                break;
        }
    }
    approximateCoordinates(fleet: Fleet): {x: number, y: number} {
        var x: number = -1;
        var y: number = -1;
        var percentDone = (this.state.clockTime - fleet.getStartTime()) / (fleet.getEndTime() - fleet.getStartTime());
        var sourceStar = this.starList.get(fleet.getSourceStarId());
        var destinationStar = this.starList.get(fleet.getDestinationStarId());
        if (!sourceStar || !destinationStar) {
            console.error(`Source or destination star not found\nSource Star ID: ${fleet.getSourceStarId()}\nDestination Star ID: ${fleet.getDestinationStarId()}\nFleet: ${fleet.toString("true")}\n Location: Galaxy.approximateCoordinates()`);
            return {x: x, y: y};
        }
        x = Math.round(sourceStar.getX() + (destinationStar.getX() - sourceStar.getX()) * percentDone);
        y = Math.round(sourceStar.getY() + (destinationStar.getY() - sourceStar.getY()) * percentDone);
        return {x: x, y: y};
    }
    assignCoreStars() {
        this.empireList.forEach((empire: Empire) => {
            var foundStar: boolean = false;
            var keys = Array.from(this.starList.keys());
            while (foundStar === false) {
                var randomstar = this.starList.get(keys[Math.floor(Math.random() * keys.length)]);
                if (!randomstar) {
                    console.error("Random star not found\n Location: Galaxy.assignCoreStars()");
                    break;
                }
                if (!randomstar.state.owner) {
                    foundStar = true;
                    randomstar.state.owner = empire.state.id;
                }
            }
        });
    }
    distanceBetweenStars(sourceStarId: string, destinationStarId: string): number {
        var sourceStar = this.starList.get(sourceStarId);
        var destinationStar = this.starList.get(destinationStarId);
        if (!sourceStar || !destinationStar) {
            console.error(`\nSource or destination star not found\n Source Star Id: ${sourceStarId}\n Destination Star Id: ${destinationStarId}`);
            return -1;
        }
        return Math.sqrt(Math.pow(sourceStar.getX() - destinationStar.getX(), 2) + Math.pow(sourceStar.getY() - destinationStar.getY(), 2));
    }
    fleetEndTimeCalculator(clockTime: number, distance: number, owner: string): number {
        var fleetEmpire = this.empireList.get(owner);
        if (!fleetEmpire) {
            console.error(`\nEmpire of Fleet not found\nOwner ID: ${owner}\n Location: Galaxy.fleetEndTimeCalculator()`);
            return clockTime + distance;
        }
        console.log("Fleet End Time Calculator:", clockTime + distance/gridUnitsPerLightYear * (hoursPerTurn * 60 * 60 * 1000) / ((fleetEmpire.state.speed + 9) / 10)+ "\nDist: " + distance + "\nSpeed: " + fleetEmpire.state.speed);
        return clockTime + distance/gridUnitsPerLightYear * (hoursPerTurn * 60 * 60 * 1000) / ((fleetEmpire.state.speed + 9) / 10);
    }
    createFleet(sourceStarId: string, destinationStarId: string, ships: number, clientId: string) {
        var empireId = this.playerToEmpireList.get(clientId);
        if (!empireId) {
            console.error(`\nEmpire of Fleet not found\nOwner ID: ${clientId}\n Location: Galaxy.createFleet()`);
            return;
        }
        const fleetId = this.idGenerator();
        this.fleetList.set(fleetId, new Fleet(new FleetState(), this, fleetId, empireId, sourceStarId, destinationStarId, ships, this.state.clockTime, this.fleetEndTimeCalculator(this.state.clockTime, this.distanceBetweenStars(sourceStarId, destinationStarId), empireId)));
    }
    renameStar(id: string, name: string, clientId: string) {
        var star = this.starList.get(id);
        if (!star) {
            console.error(`\nStar not found\nStar ID: ${id}\nLocation: Galaxy.renameStar()\nClient ID: ${clientId}`);
            return;
        }
        if (!this.playerToEmpireList.has(clientId)) {
            console.error(`\nClient empire not found\nClient ID: ${clientId}\n Location: Galaxy.renameStar()`);
            return;
        }
        var empireId = this.playerToEmpireList.get(clientId);
        if (!empireId) {
            console.error(`\nEmpire of Client not found\nClient ID: ${clientId}\n Location: Galaxy.renameStar()`);
            return;
        }
        if (star.state.owner !== empireId) {
            console.error(`\nStar not owned by empire\nStar ID: ${id}\nStar Owner ID: ${star.state.owner}\nOwner ID: ${empireId}\nClient ID: ${clientId}\nLocation: Galaxy.renameStar()`);
            return;
        }
        star.state.name = name;
        this.updatePlayersStarView("rename", {starId: id, name: name, empireId: empireId});
    }
    destroyFleet(id: string) {
        this.fleetList.delete(id);
    }
    fleetArrive(fleet: Fleet) {
        var star = this.starList.get(fleet.state.destinationStarId);
        if (!star) {
            console.error(`\nStar of Fleet Destination not found - destroying orphaned fleet\nFleet ID: ${fleet.state.id}\nDestination Star ID: ${fleet.state.destinationStarId}\nLocation: Galaxy.fleetArrive(), 1`);
            this.destroyFleet(fleet.getId());
            return;
        }
        if (star.state.owner === fleet.state.owner) {
            star.state.shipCount += fleet.state.ships;
            this.destroyFleet(fleet.getId());
        }
        else {
            //Battle
            var defenders = this.empireList.get(star.state.owner);
            var attackers = this.empireList.get(fleet.state.owner);
            if (!attackers) {
                console.error(`\nAttacker Empire not found\nOwner ID: ${fleet.state.owner}\nEmpire List: ${this.empireList}\nLocation: Galaxy.fleetArrive(), 2`);
                return;
            }
            if (!defenders) {
                console.warn(`\nDefender Empire not found\nOwner ID: ${star.state.owner}\nEmpire List: ${this.empireList}\nLocation: Galaxy.fleetArrive(), 2`);
                star.state.shipCount = fleet.state.ships - star.state.shipCount;
                this.destroyFleet(fleet.state.id);
                star.state.owner = fleet.state.owner;
                this.updatePlayersStarView("capture", {starId: star.state.id, attackerId: fleet.state.owner, defenderId: "", unowned: true});
                return;
            }
            var defendersBattlePower = defenders.state.battlePower;
            var attackersBattlePower = attackers.state.battlePower;
            var defenderShips: number = star.state.shipCount;
            var attackerShips: number = fleet.state.ships;
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
                star.state.shipCount = (defenderShips - attackerShips * (1 + defendersBattlePower/10 - attackersBattlePower/10)) + randomizedOutcome;
                this.destroyFleet(fleet.state.id);
                this.updatePlayersStarView("shipCountChange", {starId: star.state.id, shipCount: star.state.shipCount});
            }
            else {
                this.updatePlayersStarView("capture", {starId: star.state.id, attackerId: fleet.state.owner, defenderId: star.state.owner});
                star.state.owner = fleet.state.owner;
                star.state.shipCount = (attackerShips - defenderShips * (1 + attackersBattlePower/10 - defendersBattlePower/10)) + randomizedOutcome;
                this.destroyFleet(fleet.state.id);
                this.updatePlayersStarView("shipCountChange", {starId: star.state.id, shipCount: star.state.shipCount});
            }
        }
    }
    idGenerator(): string { //P
        this.idCounter++;
        return this.idCounter.toString();
    }
    getFactoryCost(ownerId: string) { //N
        return 1;
    }
    getSpeedCost(ownerId: string) { //N
        return 1;
    }
    getRangeCost(ownerId: string) { //N
        return 1;
    }
    getBattlePowerCost(ownerId: string) { //N
        return 1;
    }
    getId(): string {
        return this.state.id;
    }
    sendFleet(sourceStarId: string, destinationStarId: string, ships: number, clientId: string) {
        var sourceStar = this.starList.get(sourceStarId);
        var destinationStar = this.starList.get(destinationStarId);
        if (!sourceStar || !destinationStar) {
            console.error(`\nSource or destination star not found\nSource Star ID: ${sourceStarId}\nDestination Star ID: ${destinationStarId}\nStar List: ${this.starList}\nLocation: Galaxy.sendFleet()`);
            return;
        }
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\nLocation: Galaxy.sendFleet()`);
            return;
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\nLocation: Galaxy.sendFleet()`);
            return;
        }
        if (sourceStar.state.owner !== clientEmpire.getId()) {
            console.error(`\nSource star not owned by player\nOwner ID: ${sourceStar.state.owner}\n Location: Galaxy.sendFleet()`);
            return;
        }
        if (sourceStar.state.shipCount < ships) {
            console.error(`\nNot enough ships\nOwner ID: ${sourceStar.state.shipCount}\n Location: Galaxy.sendFleet()`);
            return;
        }
        var distance = this.distanceBetweenStars(sourceStarId, destinationStarId);
        var lightyears = distance/gridUnitsPerLightYear;
        if (lightyears > clientEmpire.state.range) {
            console.error(`\nEmpire range doesn't reach ${lightyears} lightyears\nRange: ${clientEmpire.state.range}\nEmpire: ${clientEmpire.toString("true")}\n Location: Galaxy.sendFleet()`);
            return;
        }
        sourceStar.state.shipCount -= ships;
        this.updatePlayersStarView("shipCountChange", {starId: sourceStarId, shipCount: sourceStar.state.shipCount});
        this.createFleet(sourceStarId, destinationStarId, ships, clientId);
    }
    buildFactory(starId: string, clientId: string) {
        var star = this.starList.get(starId);
        if (!star) {
            console.error(`\nStar not found\nStar ID: ${starId}\n Location: Galaxy.buildFactory()`);
            return;
        }
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.buildFactory()`);
            return;
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.buildFactory()`);
            return;
        }
        if (star.state.owner !== clientEmpire.state.id) {
            console.error(`\nStar not owned by player\nOwner ID: ${star.state.owner}\n Location: Galaxy.buildFactory()`);
            return;
        }
        if (clientEmpire.state.wealth < clientEmpire.state.factoryCost) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.state.wealth}\nCost: ${clientEmpire.state.factoryCost}\n Location: Galaxy.buildFactory()`);
            return;
        }
        clientEmpire.state.wealth -= clientEmpire.state.factoryCost;
        star.state.factoryCount++;
        console.log(`\nFactory built on ${star.state.name} (Id: ${star.state.id}) for ${clientEmpire.state.name} (Id: ${clientEmpire.state.id})\nBy Player ${clientId}\nLocation: Galaxy.buildFactory()`);
    }
    upgradeSpeed(clientId: string) {
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.upgradeSpeed()`);
            return;
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.upgradeSpeed()`);
            return;
        }
        if (clientEmpire.state.wealth < clientEmpire.state.speedCost) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.state.wealth}\nCost: ${clientEmpire.state.speedCost}\nEmpire: ${clientEmpire.toString("true")}\n Location: Galaxy.upgradeSpeed()`);
            return;
        }
        clientEmpire.state.wealth -= clientEmpire.state.speedCost;
        clientEmpire.state.speed++;
        clientEmpire.state.speedCost = this.calculateSpeedCost(clientId);
        console.log(`\nSpeed upgraded to ${clientEmpire.state.speed} for ${clientEmpire.state.name} (Id: ${clientEmpire.state.ownerId})\nLocation: Galaxy.upgradeSpeed()`);
    }
    upgradeRange(clientId: string) {
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.upgradeRange()`);
            return;
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.upgradeRange()`);
            return;
        }
        if (clientEmpire.state.wealth < clientEmpire.state.rangeCost) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.state.wealth}\nCost: ${clientEmpire.state.rangeCost}\n Location: Galaxy.upgradeRange()`);
            return;
        }
        clientEmpire.state.wealth -= clientEmpire.state.rangeCost;
        clientEmpire.state.range++;
        this.updatePlayersStarView("rangeChange", {empireId: clientEmpireId, clientId: clientId});
        clientEmpire.state.rangeCost = this.calculateRangeCost(clientId);
        console.log(`\nRange upgraded to ${clientEmpire.state.range} for ${clientEmpire.state.name} (${clientEmpire.state.ownerId})\nLocation: Galaxy.upgradeRange()`);
    }
    upgradeBattlePower(clientId: string) {
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.upgradeBattlePower()`);
            return;
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.upgradeBattlePower()`);
            return;
        }
        if (clientEmpire.state.wealth < clientEmpire.state.battlePowerCost) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.state.wealth}\nCost: ${clientEmpire.state.battlePowerCost}\n Location: Galaxy.upgradeBattlePower()`);
            return;
        }
        clientEmpire.state.wealth -= clientEmpire.state.battlePowerCost;
        clientEmpire.state.battlePower++;
        clientEmpire.state.battlePowerCost = this.calculateBattlePowerCost(clientId);
        console.log(`\nBattle Power upgraded to ${clientEmpire.state.battlePower} for ${clientEmpire.state.name} (Id: ${clientEmpire.state.ownerId})\nLocation: Galaxy.upgradeBattlePower()`);
    }
    calculateSpeedCost(clientId: string): number {
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.calculateSpeedCost()`);
            return -1;
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.calculateSpeedCost()`);
            return -1;
        }
        var x  = clientEmpire.state.speedCost;
        return Math.pow(x, 1.1);
    }
    calculateRangeCost(clientId: string): number {
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.calculateRangeCost()`);
            return -1;
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.calculateRangeCost()`);
            return -1;
        }
        var x  = clientEmpire.state.rangeCost;
        return Math.pow(x, 1.1);
    }
    calculateBattlePowerCost(clientId: string): number {
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.calculateBattlePowerCost()`);
            return -1;
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.calculateBattlePowerCost()`);
            return -1;
        }
        var x  = clientEmpire.state.battlePowerCost;
        return Math.pow(x, 1.1);
    }
    sendWealth(amount: number, clientId: string, targetId: string) {
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.sendWealth()`);
            return;
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.sendWealth()`);
            return;
        }
        if (clientEmpire.state.wealth < amount) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.state.wealth}\nAmount: ${amount}\n Location: Galaxy.sendWealth()`);
            return;
        }
        var targetEmpire = this.empireList.get(targetId);
        if (!targetEmpire) {
            console.error(`\nTarget empire not found\nOwner ID: ${targetId}\n Location: Galaxy.sendWealth()`);
            return;
        }
        clientEmpire.state.wealth -= amount;
        targetEmpire.state.wealth += amount;
    }
    listStarsInRange(starId: string, clientId: string): Star[] {
        var clientEmpireId = this.playerToEmpireList.get(clientId);
        if (!clientEmpireId) {
            console.error(`Client empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.listStarsInRange()`);
            return [];
        }
        var clientEmpire = this.empireList.get(clientEmpireId);
        if (!clientEmpire) {
            console.error(`Client empire not found\nOwner ID: ${clientId}\nEmpire List: ${this.empireList}\n Location: Galaxy.listStarsInRange()`);
            return [];
        }
        var range = clientEmpire.state.range;
        var star = this.starList.get(starId);
        if (!star) {
            console.error(`Star not found\nStar ID: ${starId}\n Location: Galaxy.listStarsInRange()`);
            return [];
        }
        var starX = star.state.x;
        var starY = star.state.y;
        var starsInRange: Star[] = [];
        this.starList.forEach((star2: Star) => {
            if (star2.state.id === starId) {
            } else {
                var distance = Math.sqrt(Math.pow(starX - star2.state.x, 2) + Math.pow(starY - star2.state.y, 2));
                if (distance <= range) {
                    starsInRange.push(star2);
                }
            }
        });
        return starsInRange
    }
    sendDebugInfo(clientId: string) {
        let content1 = "";
        let content2 = "";
        let content3 = "";
        this.starList.forEach((star: Star) => {
            content1 += star.toString() + "\n";
        });
        this.fleetList.forEach((fleet: Fleet) => {
            content2 += fleet.toString() + "\n";
        });
        this.empireList.forEach((empire: Empire) => {
            content3 += empire.toString() + "\n";
        });
        let data = {content1, content2, content3};
        this.clients.getById(clientId)?.send("debugInfo", data);
    }
    async onJoin(client: Client, options: {idToken?: string}) {
        let userId: string | null = null;
        let displayName = "Anonymous Player";
        console.log("New Player Joining Galaxy...");

        // Verify Firebase token if provided
        if (options.idToken) {
            const decodedToken = await verifyIdToken(options.idToken);
            if (decodedToken) {
                userId = decodedToken.uid;
                displayName = decodedToken.name || displayName;
                
                // Create or update user in database
                await upsertUser(userId, displayName, decodedToken.email, 
                    decodedToken.firebase?.sign_in_provider || 'anonymous');
                
                // Track client session to user mapping
                this.clientToUserMap.set(client.sessionId, userId);
            }
        }

        this.state.playerIdList.push(client.sessionId);
        const playerViewState = new PlayerViewState();
        playerViewState.sessionId = client.sessionId;
        client.send("playerViewState", playerViewState);
        this.playerViewStateList.set(client.sessionId, playerViewState);

        // Check if user has an existing empire in this galaxy (re-attachment)
        let empireId: string;
        let reattached = false;
        
        if (userId) {
            // Check for existing game association
            const existingAssociation = await getGameAssociation(userId, this.roomId);
            if (existingAssociation && this.empireList.has(existingAssociation.empireId)) {
                // Re-attach to existing empire
                empireId = existingAssociation.empireId;
                const empire = this.empireList.get(empireId)!;
                empire.state.ownerId = client.sessionId; // Update to new session ID
                this.playerToEmpireList.set(client.sessionId, empireId);
                this.userIdToEmpireList.set(userId, empireId);
                
                // Update association to mark as active
                await getOrCreateGameAssociation(userId, this.roomId, empireId);
                
                this.genPlayerStarView(client.sessionId);
                this.genPlayerFleetView(client.sessionId);

                console.log(`User ${userId} re-attached to empire ${empireId} in galaxy ${this.roomId}`);
                reattached = true;
            }
        }

        // If no existing empire, create a new one
        if (!reattached) {
            const empireName = displayName + "'s Empire";
            empireId = this.idGenerator();
            this.empireList.set(empireId, new Empire(
                new EmpireState(), 
                empireId, 
                empireName, 
                client.sessionId, 
                this.state.startingWealth, 
                this.state.factoryCost, 
                this.state.startingSpeed, 
                this.state.startingRange, 
                this.state.startingBattlePower, 
                this.state.startingSpeedCost, 
                this.state.startingRangeCost, 
                this.state.startingBattlePowerCost
            ));
            this.playerToEmpireList.set(client.sessionId, empireId);
            
            if (userId) {
                this.userIdToEmpireList.set(userId, empireId);
                // Persist the game association
                await getOrCreateGameAssociation(userId, this.roomId, empireId);
                console.log(`User ${userId} created new empire ${empireId} in galaxy ${this.roomId}`);
            }
        }

        client.send("yourIDs", {Id: client.sessionId, empireId: empireId!, userId: userId});
    }
}