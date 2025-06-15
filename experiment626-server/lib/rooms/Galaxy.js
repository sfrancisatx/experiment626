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
const galaxySize = new Map([
    ["small", 5000],
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
    }
    onCreate(options) {
        console.log("Galaxy created");
        this.state = new GalaxyState_1.GalaxyState();
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
                case "printMap":
                    this.printMap();
                    break;
                default:
                    console.warn("Gibberish in the message " + type + " " + data);
                    break;
            }
        });
        this.setSimulationInterval((deltaTime) => {
            this.state.clockTime += deltaTime;
            this.fleetList.forEach((fleet) => {
                fleet.update(deltaTime);
            });
        });
    }
    initGalaxy(generationMethod) {
        switch (generationMethod) {
            case "test":
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error("Invalid galaxy size");
                    gsize = galaxySize.get("medium");
                }
                for (let i = 0; i < gsize; i += 1000) {
                    for (let j = 0; j < gsize; j += 1000) {
                        this.starList.push(new Star_1.Star(new StarState_1.StarState(), this.idGenerator(), "Star " + this.starList.length, "", j, i, 100, 100, 0));
                    }
                }
                this.assignCoreStars();
                break;
            default:
                var gsize = galaxySize.get(this.state.size);
                if (!gsize) {
                    console.error("Invalid galaxy size");
                    gsize = galaxySize.get("medium");
                }
                for (let i = 0; i < gsize / 100; i++) {
                    var x = Math.round(Math.random() * gsize);
                    var y = Math.round(Math.random() * gsize);
                    var notTooClose = true;
                    for (let j = 0; j < this.starList.length; j++) {
                        var distance = Math.sqrt(Math.pow(x - this.starList[j].getX(), 2) + Math.pow(y - this.starList[j].getY(), 2));
                        if (distance < 100) {
                            notTooClose = false;
                        }
                    }
                    if (notTooClose) {
                        this.starList.push(new Star_1.Star(new StarState_1.StarState(), this.idGenerator(), "Star " + this.starList.length, "", x, y, 100, 100, 0));
                    }
                }
                this.assignCoreStars();
                break;
        }
    }
    printMap() {
        var size = galaxySize.get(this.state.size);
        if (!size) {
            console.error("Invalid galaxy size");
            size = galaxySize.get("medium");
        }
        var map = "";
        for (let y = 0; y < size; y++) {
            map += "\n";
            for (let x = 0; x < size; x++) {
                var addedSquare = false;
                this.starList.forEach((star) => {
                    if (star.getX() === x && star.getY() === y) {
                        map += "🟨";
                        addedSquare = true;
                    }
                });
                this.fleetList.forEach((fleet) => {
                    const fleetCoordinates = this.approximateCoordinates(fleet);
                    if (fleetCoordinates.x === x && fleetCoordinates.y === y && !addedSquare) {
                        map += "🟦";
                        addedSquare = true;
                    }
                    else if (fleetCoordinates.x === x && fleetCoordinates.y === y && addedSquare) {
                        map = map.substring(0, map.length - 1);
                        map += "🟥";
                    }
                });
                if (!addedSquare) {
                    map += "⬛️";
                }
            }
        }
        this.clients.forEach((client) => {
            client.send("mapData", { map: map });
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
        x = sourceStar.getX() + (destinationStar.getX() - sourceStar.getX()) * percentDone;
        y = sourceStar.getY() + (destinationStar.getY() - sourceStar.getY()) * percentDone;
        return { x: x, y: y };
    }
    assignCoreStars() {
        this.state.playerIdList.forEach((playerId) => {
            var randomstar = this.starList[Math.round(Math.random() * this.starList.length)];
            if (randomstar.getOwner() === "") {
                randomstar.setOwner(playerId);
                this.empireList.find((empire) => {
                    if (empire.getOwnerId() === playerId) {
                        var newStarsOwned = empire.getStarsOwned();
                        newStarsOwned.push(randomstar);
                        empire.setStarsOwned(newStarsOwned);
                    }
                });
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
            if (empire.getOwnerId() === owner) {
                return true;
            }
            return false;
        });
        if (!fleetEmpire) {
            console.error("Empire of Fleet not found");
            return clockTime + distance;
        }
        return clockTime + distance / fleetEmpire.getSpeed();
    }
    createFleet(sourceStarId, destinationStarId, ships, owner) {
        this.fleetList.push(new Fleet_1.Fleet(new FleetState_1.FleetState(), this, this.idGenerator(), owner, sourceStarId, destinationStarId, ships, this.state.clockTime, this.fleetEndTimeCalculator(this.state.clockTime, this.distanceBetweenStars(sourceStarId, destinationStarId), owner)));
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
                console.error("Defender Empire not found");
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
    onJoin(client, options) {
        this.state.playerIdList.push(client.sessionId);
        if (options.empireName) {
            this.empireList.push(new Empire_1.Empire(new EmpireState_1.EmpireState(), this.idGenerator(), options.empireName, client.sessionId, [], this.state.startingWealth, this.state.startingResearchPoints, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower));
        }
        else {
            console.error("No empire name provided");
            this.empireList.push(new Empire_1.Empire(new EmpireState_1.EmpireState(), this.idGenerator(), "Default Empire Name Resolve Failure", client.sessionId, [], this.state.startingWealth, this.state.startingResearchPoints, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower));
        }
    }
}
exports.Galaxy = Galaxy;
