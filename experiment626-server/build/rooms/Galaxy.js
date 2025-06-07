"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Galaxy = void 0;
const GalaxyState_1 = require("./schema/GalaxyState");
const core_1 = require("@colyseus/core");
const Fleet_1 = require("./Fleet");
const Empire_1 = require("./Empire");
const EmpireState_1 = require("./schema/EmpireState");
const FleetState_1 = require("./schema/FleetState");
class Galaxy extends core_1.Room {
    constructor() {
        super(...arguments);
        this.fleetList = [];
        this.starList = [];
        this.empireList = [];
        this.idCounter = 0;
    }
    onCreate(options) {
        this.state = new GalaxyState_1.GalaxyState();
        this.state.startingResearchPoints = options.startingResearchPoints;
        this.state.startingSpeed = options.startingSpeed;
        this.state.startingRange = options.startingRange;
        this.state.startingBattlePower = options.startingBattlePower;
        this.state.startingWealth = options.startingWealth;
        this.state.startingStars = options.startingStars;
        this.state.startingShips = options.startingShips;
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
                default:
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
        var star = this.starList.find((star) => {
            return star.getId() === fleet.getDestinationStarId();
        });
        if (star.getOwner() === fleet.getOwner()) {
            star.setShipCount(star.getShipCount() + fleet.getShips());
            this.destroyFleet(fleet.getId());
        }
        else {
            //Battle
            var defendersBattlePower = this.empireList.find((empire) => {
                return empire.getOwnerId() === star.getOwner();
            }).getBattlePower();
            var attackersBattlePower = this.empireList.find((empire) => {
                return empire.getOwnerId() === fleet.getOwner();
            }).getBattlePower();
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
    onJoin(client, empireName) {
        this.state.playerIdList.push(client.sessionId);
        this.empireList.push(new Empire_1.Empire(new EmpireState_1.EmpireState(), this.idGenerator(), empireName, client.sessionId, [], this.state.startingWealth, this.state.startingResearchPoints, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower));
    }
}
exports.Galaxy = Galaxy;
