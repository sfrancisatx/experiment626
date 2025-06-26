"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Galaxy = void 0;
const GalaxyState_1 = require("./schema/GalaxyState");
const core_1 = require("@colyseus/core");
const Star_1 = require("./Star");
const Fleet_1 = require("./Fleet");
const Empire_1 = require("./Empire");
const EmpireState_1 = require("./schema/EmpireState");
const FleetState_1 = require("./schema/FleetState");
const StarState_1 = require("./schema/StarState");
const schema_1 = require("@colyseus/schema");
const OccupiedSpaceState_1 = require("./schema/OccupiedSpaceState");
const pixelsPerLightYear = 1;
const hoursPerTurn = 0.008333333333; //0.008333333333 = 1 turn every 30 seconds
const startingRange = 17;
const galaxySize = new Map([
    ["itty", 100],
    ["small", 1000],
    ["medium", 10000],
    ["large", 15000]
]);
class Galaxy extends core_1.Room {
    constructor() {
        super(...arguments);
        this.fleetList = [];
        this.starList = [];
        this.empireList = [];
        this.idCounter = 0;
        this.skipToNextTurn = false;
        this.nextTurnTime = hoursPerTurn * 60 * 60 * 1000;
    }
    onCreate(options) {
        console.log("Galaxy created");
        this.state = new GalaxyState_1.GalaxyState();
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
        this.state.mapBlueprint = new schema_1.ArraySchema();
        if (options.vpId) {
            this.state.vpId = options.vpId;
        }
        //Must insantiate all player ids
        //Must instantiate all stars
        //
        this.onMessage("*", (client, type, data) => {
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
                    this.fleetList.forEach((fleet) => {
                        console.log(fleet.toString(data.verbose));
                    });
                    break;
                case "listStars":
                    this.starList.forEach((star) => {
                        console.log(star.toString(data.verbose));
                    });
                    break;
                case "listEmpires":
                    this.empireList.forEach((empire) => {
                        console.log(empire.toString(data.verbose));
                    });
                    break;
                case "listPlayers":
                    console.log(this.state.playerIdList);
                    break;
                case "listClockTime":
                    console.log(this.state.clockTime / 1000);
                    break;
                case "listVP":
                    console.log(this.state.vpId);
                    break;
                case "init":
                    console.log("init " + this.state.clockTime / 1000);
                    this.initGalaxy(data.generationMethod);
                    console.log("done init " + this.state.clockTime / 1000);
                    break;
                case "printMap":
                    console.log("printMap " + this.state.clockTime / 1000);
                    this.printMap();
                    console.log("done printMap " + this.state.clockTime / 1000);
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
                default:
                    console.warn("Gibberish in the message " + type + " " + data);
                    break;
            }
        });
        this.setSimulationInterval((deltaTime) => {
            this.state.clockTime += deltaTime;
            if (this.skipToNextTurn) {
                this.skipToNextTurn = false;
                this.state.clockTime += (hoursPerTurn * 60 * 60 * 1000) - (this.state.clockTime % (hoursPerTurn * 60 * 60 * 1000));
            }
            this.fleetList.forEach((fleet) => {
                fleet.update(this.state.clockTime);
            });
            while (this.state.clockTime >= this.nextTurnTime) {
                this.turn();
                console.log("Turn at " + this.state.clockTime / 1000);
                this.nextTurnTime += hoursPerTurn * 60 * 60 * 1000;
            }
            this.printMap();
        });
    }
    turn() {
        // Allocating the new ships to stars
        this.starList.forEach((star) => {
            star.setShipCount(star.getShipCount() + star.getFactoryCount());
        });
        // Generating wealth for each empire
        this.empireList.forEach((empire) => {
            var starsOwned = this.starList.filter((star) => {
                return star.getOwner() === empire.getId();
            });
            var wealthGenerated = 0;
            starsOwned.forEach((star) => {
                wealthGenerated += star.getWealthProduction();
            });
            empire.setWealth(empire.getWealth() + wealthGenerated);
        });
    }
    initGalaxy(generationMethod) {
        this.starList = [];
        switch (generationMethod) {
            case "test":
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error("Invalid galaxy size");
                    gsize = galaxySize.get("itty");
                    this.state.size = "itty";
                }
                for (let i = 10; i < gsize; i += 10) {
                    for (let j = 10; j < gsize; j += 10) {
                        this.starList.push(new Star_1.Star(new StarState_1.StarState(), this.idGenerator(), "Star " + this.starList.length, "", j, i, 100, 0, 0));
                    }
                }
                this.assignCoreStars();
                break;
            default:
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error("Invalid galaxy size");
                    gsize = galaxySize.get("itty");
                    this.state.size = "itty";
                }
                for (let i = 0; i < gsize / 5; i++) {
                    var x = Math.round(Math.random() * gsize);
                    var y = Math.round(Math.random() * gsize);
                    var notTooClose = true;
                    for (let j = 0; j < this.starList.length; j++) {
                        var distance = Math.sqrt(Math.pow(x - this.starList[j].getX(), 2) + Math.pow(y - this.starList[j].getY(), 2));
                        if (distance < 5) {
                            notTooClose = false;
                            i--;
                        }
                    }
                    if (notTooClose) {
                        this.starList.push(new Star_1.Star(new StarState_1.StarState(), this.idGenerator(), "Star " + this.starList.length, "", x, y, 100, 0, 0));
                    }
                }
                this.assignCoreStars();
                break;
        }
    }
    printMap() {
        this.state.mapBlueprint.clear();
        this.starList.forEach((star) => {
            const occupiedSpaceState = new OccupiedSpaceState_1.OccupiedSpaceState();
            occupiedSpaceState.x = star.getX();
            occupiedSpaceState.y = star.getY();
            if (star.getOwner()) {
                occupiedSpaceState.owner = star.getOwner();
            }
            occupiedSpaceState.type = "s";
            if (isNaN(occupiedSpaceState.x) || isNaN(occupiedSpaceState.y)) {
                console.error("❌ NaN found! " + star.getX() + "," + star.getY());
            }
            this.state.mapBlueprint.push(occupiedSpaceState);
        });
        this.fleetList.forEach((fleet) => {
            var coords = this.approximateCoordinates(fleet);
            const occupiedSpaceState = new OccupiedSpaceState_1.OccupiedSpaceState();
            occupiedSpaceState.x = coords.x;
            occupiedSpaceState.y = coords.y;
            occupiedSpaceState.type = "f";
            if (isNaN(occupiedSpaceState.x) || isNaN(occupiedSpaceState.y)) {
                console.error("❌ NaN found! " + coords.x + "," + coords.y);
            }
            this.state.mapBlueprint.push(occupiedSpaceState);
        });
    }
    approximateCoordinates(fleet) {
        var x = -1;
        var y = -1;
        var percentDone = (this.state.clockTime - fleet.getStartTime()) / (fleet.getEndTime() - fleet.getStartTime());
        var sourceStar = this.starList.find((star) => {
            if (star.getId() === fleet.getSourceStarId()) {
                return true;
            }
            return false;
        });
        var destinationStar = this.starList.find((star) => {
            if (star.getId() === fleet.getDestinationStarId()) {
                return true;
            }
            return false;
        });
        if (!sourceStar || !destinationStar) {
            console.error("Source or destination star not found");
            return { x: x, y: y };
        }
        x = Math.round(sourceStar.getX() + (destinationStar.getX() - sourceStar.getX()) * percentDone);
        y = Math.round(sourceStar.getY() + (destinationStar.getY() - sourceStar.getY()) * percentDone);
        return { x: x, y: y };
    }
    assignCoreStars() {
        this.empireList.forEach((empire) => {
            var foundStar = false;
            while (foundStar === false) {
                var randomstar = this.starList[Math.floor(Math.random() * this.starList.length)];
                if (!randomstar) {
                    console.error("Random star not found: Assigning core stars");
                    break;
                }
                if (!randomstar.getOwner()) {
                    foundStar = true;
                    randomstar.setOwner(empire.getId());
                }
            }
        });
    }
    distanceBetweenStars(sourceStarId, destinationStarId) {
        var twoStars = this.starList.filter((star) => {
            if (star.getId() === sourceStarId || star.getId() === destinationStarId) {
                return true;
            }
            return false;
        });
        return Math.sqrt(Math.pow(twoStars[0].getX() - twoStars[1].getX(), 2) + Math.pow(twoStars[0].getY() - twoStars[1].getY(), 2));
    }
    fleetEndTimeCalculator(clockTime, distance, owner) {
        var fleetEmpire = this.empireList.find((empire) => {
            if (empire.getId() === owner) {
                return true;
            }
            return false;
        });
        if (!fleetEmpire) {
            console.error("Empire of Fleet not found");
            return clockTime + distance;
        }
        return clockTime + distance / startingRange * (hoursPerTurn * 60 * 60 * 1000) / ((fleetEmpire.getSpeed() + 9) / 10);
    }
    createFleet(sourceStarId, destinationStarId, ships, clientId) {
        var empire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (empire) {
            this.fleetList.push(new Fleet_1.Fleet(new FleetState_1.FleetState(), this, this.idGenerator(), empire.getId(), sourceStarId, destinationStarId, ships, this.state.clockTime, this.fleetEndTimeCalculator(this.state.clockTime, this.distanceBetweenStars(sourceStarId, destinationStarId), empire.getId())));
        }
    }
    renameStar(id, name, owner) {
        this.starList.forEach((star) => {
            if (star.getId() === id && star.getOwner() === owner) {
                star.setName(name);
            }
        });
    }
    destroyFleet(id) {
        this.fleetList = this.fleetList.filter((fleet) => {
            return fleet.getId() !== id;
        });
    }
    fleetArrive(fleet) {
        var star = this.starList.find((star2) => {
            return star2.getId() === fleet.getDestinationStarId();
        });
        if (!(star instanceof Star_1.Star)) {
            console.error("Star of Fleet Destination not found");
            return;
        }
        if (star.getOwner() === fleet.getOwner()) {
            star.setShipCount(star.getShipCount() + fleet.getShips());
            this.destroyFleet(fleet.getId());
        }
        else {
            //Battle
            var defenders = this.empireList.find((empire) => {
                if (!star) {
                    console.error("Star of Fleet Destination not found");
                    return false;
                }
                return empire.getOwnerId() === star.getOwner();
            });
            if (!defenders) {
                star.setShipCount(fleet.getShips());
                this.destroyFleet(fleet.getId());
                star.setOwner(fleet.getOwner());
                return;
            }
            var defendersBattlePower = defenders.getBattlePower();
            var attackers = this.empireList.find((empire) => {
                return empire.getOwnerId() === fleet.getOwner();
            });
            if (!attackers) {
                console.error("Attacker Empire not found");
                return;
            }
            var attackersBattlePower = attackers.getBattlePower();
            var defenderShips = star.getShipCount();
            var attackerShips = fleet.getShips();
            var difference = defenderShips * (1 + defendersBattlePower / 10) - attackerShips * (1 + attackersBattlePower / 10);
            var defenderWin = difference >= 0;
            var upsetChance;
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
            if (defenderWin) {
                upsetChance -= 2.5;
            }
            if (Math.random() * 100 <= upsetChance) {
                defenderWin = !defenderWin;
            }
            var randomizedOutcome = Math.random() * 10;
            if (Math.random() >= 0.5) {
                randomizedOutcome = randomizedOutcome * -1;
            }
            if (defenderWin) {
                star.setShipCount((defenderShips - attackerShips * (1 + defendersBattlePower / 10 - attackersBattlePower / 10)) + randomizedOutcome);
                this.destroyFleet(fleet.getId());
            }
            else {
                star.setOwner(fleet.getOwner());
                star.setShipCount((attackerShips - defenderShips * (1 + attackersBattlePower / 10 - defendersBattlePower / 10)) + randomizedOutcome);
                this.destroyFleet(fleet.getId());
            }
        }
    }
    idGenerator() {
        this.idCounter++;
        return this.idCounter.toString();
    }
    getFactoryCost(ownerId) {
        return 1;
    }
    getSpeedCost(ownerId) {
        return 1;
    }
    getRangeCost(ownerId) {
        return 1;
    }
    getBattlePowerCost(ownerId) {
        return 1;
    }
    getId() {
        return this.state.id;
    }
    sendFleet(sourceStarId, destinationStarId, ships, clientId) {
        var sourceStar = this.starList.find((star) => {
            if (star.getId() === sourceStarId) {
                return true;
            }
            return false;
        });
        var destinationStar = this.starList.find((star) => {
            if (star.getId() === destinationStarId) {
                return true;
            }
            return false;
        });
        if (!sourceStar || !destinationStar) {
            console.error("Source or destination star not found");
            return;
        }
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return;
        }
        if (sourceStar.getOwner() !== clientEmpire.getId()) {
            console.error("Source star not owned by player");
            return;
        }
        if (sourceStar.getShipCount() < ships) {
            console.error("Not enough ships");
            return;
        }
        var distance = this.distanceBetweenStars(sourceStarId, destinationStarId);
        var lightyears = distance / pixelsPerLightYear;
        if (lightyears > clientEmpire.getRange()) {
            console.error("Empire cannot reach " + lightyears + " lightyears");
            return;
        }
        sourceStar.setShipCount(sourceStar.getShipCount() - ships);
        this.createFleet(sourceStarId, destinationStarId, ships, clientId);
    }
    buildFactory(starId, clientId) {
        var star = this.starList.find((star) => {
            if (star.getId() === starId) {
                return true;
            }
            return false;
        });
        if (!star) {
            console.error("Star not found");
            return;
        }
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return;
        }
        if (star.getOwner() !== clientEmpire.getId()) {
            console.error("Star not owned by player");
            return;
        }
        if (clientEmpire.getWealth() < clientEmpire.getFactoryCost()) {
            console.error("Not enough wealth");
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - clientEmpire.getFactoryCost());
        star.setFactoryCount(star.getFactoryCount() + 1);
        console.log("Factory Built on " + star.getName() + " (" + star.getId() + ")");
    }
    upgradeSpeed(clientId) {
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return;
        }
        if (clientEmpire.getWealth() < clientEmpire.getSpeedCost()) {
            console.error("Not enough wealth");
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - clientEmpire.getSpeedCost());
        clientEmpire.setSpeed(clientEmpire.getSpeed() + 1);
        clientEmpire.setSpeedCost(this.calculateSpeedCost(clientId));
        console.log("Speed upgraded to " + clientEmpire.getSpeed() + " for " + clientEmpire.getName());
    }
    upgradeRange(clientId) {
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return;
        }
        if (clientEmpire.getWealth() < clientEmpire.getRangeCost()) {
            console.error("Not enough wealth");
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - clientEmpire.getRangeCost());
        clientEmpire.setRange(clientEmpire.getRange() + 1);
        clientEmpire.setRangeCost(this.calculateRangeCost(clientId));
        console.log("Range upgraded to " + clientEmpire.getRange() + " for " + clientEmpire.getName());
    }
    upgradeBattlePower(clientId) {
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return;
        }
        if (clientEmpire.getWealth() < clientEmpire.getBattlePowerCost()) {
            console.error("Not enough wealth");
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - clientEmpire.getBattlePowerCost());
        clientEmpire.setBattlePower(clientEmpire.getBattlePower() + 1);
        clientEmpire.setBattlePowerCost(this.calculateBattlePowerCost(clientId));
        console.log("Battle Power upgraded to " + clientEmpire.getBattlePower() + " for " + clientEmpire.getName());
    }
    calculateSpeedCost(clientId) {
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return -1;
        }
        var x = clientEmpire.getSpeedCost();
        return Math.pow(x, 1.1);
    }
    calculateRangeCost(clientId) {
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return -1;
        }
        var x = clientEmpire.getRangeCost();
        return Math.pow(x, 1.1);
    }
    calculateBattlePowerCost(clientId) {
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return -1;
        }
        var x = clientEmpire.getBattlePowerCost();
        return Math.pow(x, 1.1);
    }
    sendWealth(amount, clientId, targetId) {
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return;
        }
        if (clientEmpire.getWealth() < amount) {
            console.error("Not enough wealth");
            return;
        }
        clientEmpire.setWealth(clientEmpire.getWealth() - amount);
        var targetEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === targetId) {
                return true;
            }
            return false;
        });
        if (!targetEmpire) {
            console.error("Target empire not found");
            return;
        }
        targetEmpire.setWealth(targetEmpire.getWealth() + amount);
    }
    listStarsInRange(starId, clientId) {
        var clientEmpire = this.empireList.find((empire) => {
            if (empire.getOwnerId() === clientId) {
                return true;
            }
            return false;
        });
        if (!clientEmpire) {
            console.error("Client empire not found");
            return;
        }
        var range = clientEmpire.getRange();
        var star = this.starList.find((star) => {
            if (star.getId() === starId) {
                return true;
            }
            return false;
        });
        if (!star) {
            console.error("Star not found");
            return;
        }
        var starX = star.getX();
        var starY = star.getY();
        var starsInRange = this.starList.filter((star2) => {
            if (star2.getId() === starId) {
                return false;
            }
            var distance = Math.sqrt(Math.pow(starX - star2.getX(), 2) + Math.pow(starY - star2.getY(), 2));
            console.log(star2.getId() + ": " + distance);
            return distance <= range;
        });
        starsInRange.forEach((star) => {
            console.log(star.toString());
        });
    }
    onJoin(client, options) {
        this.state.playerIdList.push(client.sessionId);
        if (options.empireName) {
            this.empireList.push(new Empire_1.Empire(new EmpireState_1.EmpireState(), this.idGenerator(), options.empireName, client.sessionId, this.state.startingWealth, this.state.factoryCost, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower, this.state.startingSpeedCost, this.state.startingRangeCost, this.state.startingBattlePowerCost));
        }
        else {
            console.error("No empire name provided");
            this.empireList.push(new Empire_1.Empire(new EmpireState_1.EmpireState(), this.idGenerator(), "Default Empire Name Resolve Failure", client.sessionId, this.state.startingWealth, this.state.factoryCost, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower, this.state.startingSpeedCost, this.state.startingRangeCost, this.state.startingBattlePowerCost));
        }
        client.send("yourIDs", { Id: client.sessionId, empireId: this.empireList[this.empireList.length - 1].getId() });
    }
}
exports.Galaxy = Galaxy;
