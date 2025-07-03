import { GalaxyState } from "./schema/GalaxyState";
import { Client, Room } from "@colyseus/core";
import { Star } from "./Star";
import { Fleet } from "./Fleet";
import { Empire } from "./Empire";
import { EmpireState } from "./schema/EmpireState";
import { FleetState } from "./schema/FleetState";
import { StarState } from "./schema/StarState";
import { ArraySchema } from "@colyseus/schema";
import { OccupiedSpaceState } from "./schema/OccupiedSpaceState";

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
    size: string;
}

const gridUnitsPerLightYear = 1;
const hoursPerTurn = 0.008333333333; //0.008333333333 = 1 turn every 30 seconds
const startingRange = 17;

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
    skipToNextTurn: boolean = false;
    nextTurnTime: number = hoursPerTurn * 60 * 60 * 1000;
    nextUITime: number = 2000;
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
        this.state.size = options.size;
        this.state.mapBlueprint = new ArraySchema<OccupiedSpaceState>();
        this.nextUITime = this.state.clockTime + 2000;
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
                    this.printMap();
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
                    this.listStarsInRange(data.starId, client.sessionId);
                    break;
                case "addClockTime":
                    this.state.clockTime += data.amount;
                    break;
                case "listDebugInfo":
                    this.sendDebugInfo(client.sessionId);
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
            this.printMap();
        });
    }
    turn() {
        // Allocating the new ships to stars
        this.starList.forEach((star: Star) => {
            star.setShipCount(star.getShipCount()+ star.getFactoryCount());
        });
        // Generating wealth for each empire
        this.empireList.forEach((empire: Empire) => {
            var starsOwned = this.starList.filter((star: Star) => {
                return star.getOwner() === empire.getId();
            });
            var wealthGenerated = 0;
            starsOwned.forEach((star: Star) => {
                wealthGenerated += star.getWealthProduction();
            });
            empire.setWealth(empire.getWealth() + wealthGenerated);
        });
    }
    initGalaxy(generationMethod: string) {
        this.starList = [];
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
                        this.starList.push(new Star(new StarState(), this.idGenerator(), "Star " + this.starList.length, "", j, i, 100, 0, 0));
                    }
                }
                this.assignCoreStars();
                break;
            default:
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error(`Invalid galaxy size: ${this.state.size}\n Location: Galaxy.initGalaxy(), 2`);
                    gsize = galaxySize.get("itty")!;
                    this.state.size = "itty";
                }
                for (let i = 0; i < gsize/5; i++) {
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
                        this.starList.push(new Star(new StarState(), this.idGenerator(), "Star " + this.starList.length, "", x, y, 100, 0, 0));
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
            if (star.getOwner()) {
                occupiedSpaceState.owner = star.getOwner();
            }
            occupiedSpaceState.type = "s";
            if (isNaN(occupiedSpaceState.x) || isNaN(occupiedSpaceState.y)) {
                console.error(`❌ NaN found! ${occupiedSpaceState.x},${occupiedSpaceState.y}\n Location: Galaxy.printMap(), 1`);
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
                console.error(`❌ NaN found! ${occupiedSpaceState.x},${occupiedSpaceState.y}\n Location: Galaxy.printMap(), 2`);
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
            console.error(`Source or destination star not found\nSource Star ID: ${fleet.getSourceStarId()}\nDestination Star ID: ${fleet.getDestinationStarId()}\n Location: Galaxy.approximateCoordinates()`);
            return {x: x, y: y};
        }
        x = Math.round(sourceStar.getX() + (destinationStar.getX() - sourceStar.getX()) * percentDone);
        y = Math.round(sourceStar.getY() + (destinationStar.getY() - sourceStar.getY()) * percentDone);
        return {x: x, y: y};
    }
    assignCoreStars() {
        this.empireList.forEach((empire: Empire) => {
            var foundStar: boolean = false;
            while (foundStar === false) {
                var randomstar = this.starList[Math.floor(Math.random() * this.starList.length)];
                if (!randomstar) {
                    console.error("Random star not found\n Location: Galaxy.assignCoreStars()");
                    break;
                }
                if (!randomstar.getOwner()) {
                    foundStar = true;
                    randomstar.setOwner(empire.getId());
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
        if (!twoStars[0] || !twoStars[1]) {
            console.error(`\nSource or destination star not found\n Source Star Id: ${sourceStarId}\n Destination Star Id: ${destinationStarId}`);
            return 1000000000000000;
        }
        return Math.sqrt(Math.pow(twoStars[0].getX() - twoStars[1].getX(), 2) + Math.pow(twoStars[0].getY() - twoStars[1].getY(), 2));
    }
    fleetEndTimeCalculator(clockTime: number, distance: number, owner: string): number {
        var fleetEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getId() === owner) {
                return true;
            }
            return false;
        });
        if (!fleetEmpire) {
            console.error(`\nEmpire of Fleet not found\nOwner ID: ${owner}\n Location: Galaxy.fleetEndTimeCalculator()`);
            return clockTime + distance;
        }
        return clockTime + distance/startingRange * (hoursPerTurn * 60 * 60 * 1000) / ((fleetEmpire.getSpeed() + 9) / 10);
    }
    createFleet(sourceStarId: string, destinationStarId: string, ships: number, clientId: string) {
        var empire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (empire) {
        this.fleetList.push(new Fleet(new FleetState(), this, this.idGenerator(), empire.getId(), sourceStarId, destinationStarId, ships, this.state.clockTime, this.fleetEndTimeCalculator(this.state.clockTime, this.distanceBetweenStars(sourceStarId, destinationStarId), empire.getId())));
        }
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
            console.error(`\nStar of Fleet Destination not found\nDestination Star ID: ${fleet.getDestinationStarId()}\n Location: Galaxy.fleetArrive(), 1`);
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
                    console.error(`\nStar of Fleet Destination not found\nDestination Star ID: ${fleet.getDestinationStarId()}\n Location: Galaxy.fleetArrive(), 2`);
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
                console.error(`\nAttacker Empire not found\nOwner ID: ${fleet.getOwner()}\n Location: Galaxy.fleetArrive()`);
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
    sendFleet(sourceStarId: string, destinationStarId: string, ships: number, clientId: string) {
        var sourceStar = this.starList.find((star: Star) => {
            if (star.getId() === sourceStarId) {
                return true;
            }
            return false;
        });
        var destinationStar = this.starList.find((star: Star) => {
            if (star.getId() === destinationStarId) {
                return true;
            }
            return false;
        });
        if (!sourceStar || !destinationStar) {
            console.error(`\nSource or destination star not found\nSource Star ID: ${sourceStarId}\nDestination Star ID: ${destinationStarId}\n Location: Galaxy.sendFleet()`);
            return;
        }
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.sendFleet()`);
            return;
        }
        if (sourceStar.getOwner() !== clientEmpire.getId()) {
            console.error(`\nSource star not owned by player\nOwner ID: ${sourceStar.getOwner()}\n Location: Galaxy.sendFleet()`);
            return;
        }
        if (sourceStar.getShipCount() < ships) {
            console.error(`\nNot enough ships\nOwner ID: ${sourceStar.getShipCount()}\n Location: Galaxy.sendFleet()`);
            return;
        }
        var distance = this.distanceBetweenStars(sourceStarId, destinationStarId);
        var lightyears = distance/gridUnitsPerLightYear;
        if (lightyears > clientEmpire.getRange()) {
            console.error(`\nEmpire range doesn't reach ${lightyears} lightyears\nRange: ${clientEmpire.getRange()}\nOwner ID: ${clientEmpire.getId()}\n Location: Galaxy.sendFleet()`);
            return;
        }
        sourceStar.setShipCount(sourceStar.getShipCount() - ships);
        this.createFleet(sourceStarId, destinationStarId, ships, clientId);
    }
    buildFactory(starId: string, clientId: string) {
        var star = this.starList.find((star: Star) => {
            if (star.getId() === starId) {
                return true;
            }
            return false;
        });
        if (!star) {
            console.error(`\nStar not found\nStar ID: ${starId}\n Location: Galaxy.buildFactory()`);
            return;
        }
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.buildFactory()`);
            return;
        }
        if (star.getOwner() !== clientEmpire.getId()) {
            console.error(`\nStar not owned by player\nOwner ID: ${star.getOwner()}\n Location: Galaxy.buildFactory()`);
            return;
        }
        if (clientEmpire.getWealth() < clientEmpire.getFactoryCost()) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.getWealth()}\nCost: ${clientEmpire.getFactoryCost()}\n Location: Galaxy.buildFactory()`);
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - clientEmpire.getFactoryCost());
        star.setFactoryCount(star.getFactoryCount() + 1);
        console.log(`\nFactory built on ${star.getName()} (${star.getId()}) for ${clientEmpire.getName()} (${clientEmpire.getId()})\nLocation: Galaxy.buildFactory()`);
    }
    upgradeSpeed(clientId: string) {
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.upgradeSpeed()`);
            return;
        }
        if (clientEmpire.getWealth() < clientEmpire.getSpeedCost()) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.getWealth()}\nCost: ${clientEmpire.getSpeedCost()}\n Location: Galaxy.upgradeSpeed()`);
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - clientEmpire.getSpeedCost());
        clientEmpire.setSpeed(clientEmpire.getSpeed() + 1);
        clientEmpire.setSpeedCost(this.calculateSpeedCost(clientId));
        console.log(`\nSpeed upgraded to ${clientEmpire.getSpeed()} for ${clientEmpire.getName()} (${clientEmpire.getId()})\nLocation: Galaxy.upgradeSpeed()`);
    }
    upgradeRange(clientId: string) {
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.upgradeRange()`);
            return;
        }
        if (clientEmpire.getWealth() < clientEmpire.getRangeCost()) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.getWealth()}\nCost: ${clientEmpire.getRangeCost()}\n Location: Galaxy.upgradeRange()`);
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - clientEmpire.getRangeCost());
        clientEmpire.setRange(clientEmpire.getRange() + 1);
        clientEmpire.setRangeCost(this.calculateRangeCost(clientId));
        console.log(`\nRange upgraded to ${clientEmpire.getRange()} for ${clientEmpire.getName()} (${clientEmpire.getId()})\nLocation: Galaxy.upgradeRange()`);
    }
    upgradeBattlePower(clientId: string) {
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.upgradeBattlePower()`);
            return;
        }
        if (clientEmpire.getWealth() < clientEmpire.getBattlePowerCost()) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.getWealth()}\nCost: ${clientEmpire.getBattlePowerCost()}\n Location: Galaxy.upgradeBattlePower()`);
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - clientEmpire.getBattlePowerCost());
        clientEmpire.setBattlePower(clientEmpire.getBattlePower() + 1);
        clientEmpire.setBattlePowerCost(this.calculateBattlePowerCost(clientId));
        console.log(`\nBattle Power upgraded to ${clientEmpire.getBattlePower()} for ${clientEmpire.getName()} (${clientEmpire.getId()})\nLocation: Galaxy.upgradeBattlePower()`);
    }
    calculateSpeedCost(clientId: string): number {
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.calculateSpeedCost()`);
            return -1;
        }
        var x  = clientEmpire.getSpeedCost();
        return Math.pow(x, 1.1);
    }
    calculateRangeCost(clientId: string): number {
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.calculateRangeCost()`);
            return -1;
        }
        var x  = clientEmpire.getRangeCost();
        return Math.pow(x, 1.1);
    }
    calculateBattlePowerCost(clientId: string): number {
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.calculateBattlePowerCost()`);
            return -1;
        }
        var x  = clientEmpire.getBattlePowerCost();
        return Math.pow(x, 1.1);
    }
    sendWealth(amount: number, clientId: string, targetId: string) {
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.sendWealth()`);
            return;
        }
        if (clientEmpire.getWealth() < amount) {
            console.error(`\nNot enough wealth\nWealth: ${clientEmpire.getWealth()}\nAmount: ${amount}\n Location: Galaxy.sendWealth()`);
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - amount);
        var targetEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === targetId) {
                return true;
            }
            return false;
        });
        if (!targetEmpire) {
            console.error(`\nTarget empire not found\nOwner ID: ${targetId}\n Location: Galaxy.sendWealth()`);
            return;
        }
        targetEmpire.setWealth(targetEmpire.getWealth() + amount);
    }
    listStarsInRange(starId: string, clientId: string) {
        var clientEmpire = this.empireList.find((empire: Empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error(`\nClient empire not found\nOwner ID: ${clientId}\n Location: Galaxy.listStarsInRange()`);
            return;
        }
        var range = clientEmpire.getRange();
        var star = this.starList.find((star: Star) => {
            if (star.getId() === starId) {
                return true;
            }
            return false;
        });
        if (!star) {
            console.error(`\nStar not found\nStar ID: ${starId}\n Location: Galaxy.listStarsInRange()`);
            return;
        }
        var starX = star.getX();
        var starY = star.getY();
        var starsInRange = this.starList.filter((star2: Star) => {
            if (star2.getId() === starId) {
                return false;
            }
            var distance = Math.sqrt(Math.pow(starX - star2.getX(), 2) + Math.pow(starY - star2.getY(), 2));
            console.log(star2.getId() + ": " + distance);
            return distance <= range;
        });
        starsInRange.forEach((star: Star) => {
            console.log(star.toString());
        });
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
    onJoin(client: Client, options: {empireName: string}) {
        this.state.playerIdList.push(client.sessionId);
        if (options.empireName) {
            this.empireList.push(new Empire(new EmpireState(), this.idGenerator(), options.empireName, client.sessionId, this.state.startingWealth, this.state.factoryCost, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower, this.state.startingSpeedCost, this.state.startingRangeCost, this.state.startingBattlePowerCost));
        }
        else {
            console.error(`\nNo empire name provided\nOwner ID: ${client.sessionId}\n Location: Galaxy.onJoin()`);
            this.empireList.push(new Empire(new EmpireState(), this.idGenerator(), "Default Empire Name Resolve Failure", client.sessionId, this.state.startingWealth, this.state.factoryCost, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower, this.state.startingSpeedCost, this.state.startingRangeCost, this.state.startingBattlePowerCost));
        }
        client.send("yourIDs", {Id: client.sessionId, empireId: this.empireList[this.empireList.length - 1].getId()});
    }
}