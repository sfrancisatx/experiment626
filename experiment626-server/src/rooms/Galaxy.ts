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
    playerIdList: string[];
}

export class Galaxy extends Room<GalaxyState> {
    fleetList: Fleet[] = [];
    starList: Star[] = [];
    empireList: Empire[] = [];
    idCounter: number = 0;
    onCreate(options: createOptions) {
        console.log("Galaxy room created with options:", options);
        
        // Initialize state with default values
        this.state = new GalaxyState();
        this.state.startingResearchPoints = 100;
        this.state.startingSpeed = 1;
        this.state.startingRange = 100;
        this.state.startingBattlePower = 10;
        this.state.startingWealth = 1000;
        this.state.startingStars = 10;
        this.state.startingShips = 5;
        this.state.playerIdList = [];
        this.state.vpId = "";
        
        console.log("Initial state created with defaults");

        // Handle initialization message
        this.onMessage("initialize", (client: Client, options: createOptions) => {
            console.log(`[Galaxy] Initializing room for ${client.sessionId} with options:`, options);
            
            // Update state with provided options
            if (options.startingResearchPoints) this.state.startingResearchPoints = options.startingResearchPoints;
            if (options.startingSpeed) this.state.startingSpeed = options.startingSpeed;
            if (options.startingRange) this.state.startingRange = options.startingRange;
            if (options.startingBattlePower) this.state.startingBattlePower = options.startingBattlePower;
            if (options.startingWealth) this.state.startingWealth = options.startingWealth;
            if (options.startingStars) this.state.startingStars = options.startingStars;
            if (options.startingShips) this.state.startingShips = options.startingShips;
            if (options.playerIdList) {
                this.state.playerIdList = options.playerIdList;
                console.log(`Updated playerIdList to:`, this.state.playerIdList);
            }
            if (options.vpId) this.state.vpId = options.vpId;
            
            // Create initial empire for the first player
            if (this.state.playerIdList.length > 0) {
                const playerId = this.state.playerIdList[0];
                const empire = new EmpireState();
                empire.id = playerId;
                empire.name = `Empire ${playerId}`;
                empire.ownerId = playerId;
                empire.wealth = this.state.startingWealth;
                empire.researchPoints = this.state.startingResearchPoints;
                empire.speed = this.state.startingSpeed;
                empire.range = this.state.startingRange;
                empire.battlePower = this.state.startingBattlePower;
                this.state.empireStateList.push(empire);
                console.log(`Created initial empire for player ${playerId}`);
            }
            
            console.log("State after initialization:", this.state);
            this.broadcast("message", {
                type: "initialized",
                content: "Room initialized successfully"
            });
        });

        // Handle initialization message
        this.onMessage("initialize", (client: Client, options: createOptions) => {
            console.log(`[Galaxy] Initializing room for ${client.sessionId} with options:`, options);
            
            // Initialize state with options
            this.state.startingResearchPoints = options.startingResearchPoints;
            this.state.startingSpeed = options.startingSpeed;
            this.state.startingRange = options.startingRange;
            this.state.startingBattlePower = options.startingBattlePower;
            this.state.startingWealth = options.startingWealth;
            this.state.startingStars = options.startingStars;
            this.state.startingShips = options.startingShips;
            this.state.playerIdList = options.playerIdList;
            if (options.vpId) {
                this.state.vpId = options.vpId;
            }
            
            // Create initial empire for the first player
            if (options.playerIdList.length > 0) {
                const playerId = options.playerIdList[0];
                const empire = new EmpireState();
                empire.id = playerId;
                empire.name = `Empire ${playerId}`;
                empire.ownerId = playerId;
                empire.wealth = this.state.startingWealth;
                empire.researchPoints = this.state.startingResearchPoints;
                empire.speed = this.state.startingSpeed;
                empire.range = this.state.startingRange;
                empire.battlePower = this.state.startingBattlePower;
                this.state.empireStateList.push(empire);
            }
            
            console.log("Initialized state:", this.state);
            
            // Broadcast initialization success
            this.broadcast("message", {
                type: "initialized",
                content: "Room initialized successfully"
            });
        });

        // Handle other messages
        this.onMessage("*", (client: Client, type: string | number, data: any) => {
            console.log(`[Galaxy] Received message from ${client.sessionId} of type ${type}:`, data);
            console.log(`Received message from ${client.sessionId}:`, data);
            this.broadcast("message", {
                type: "received",
                content: `Message from ${client.sessionId}: ${data.content}`
            });
            switch (type) {
                case "createFleet":
                    this.createFleet(data.sourceStarId, data.destinationStarId, data.ships, client.sessionId);
                    console.log("Fleet Created");
                    this.broadcast("message", {
                        type: "success",
                        content: `Fleet created by ${client.sessionId}`
                    });
                    console.log(`[Galaxy] Fleet created by ${client.sessionId}`);
                    break;
                case "renameStar":
                    this.renameStar(data.id, data.name, client.sessionId);
                    this.broadcast("message", {
                        type: "success",
                        content: "Star renamed successfully"
                    });
                    break;
                case "destroyFleet":
                    this.destroyFleet(data.id);
                    this.broadcast("message", {
                        type: "success",
                        content: "Fleet destroyed successfully"
                    });
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
        var star = this.starList.find((star: Star) => {
            return star.getId() === fleet.getDestinationStarId();
        });
        if (star.getOwner() === fleet.getOwner()) {
            star.setShipCount(star.getShipCount() + fleet.getShips());
            this.destroyFleet(fleet.getId());
        }
        else {
            //Battle
            var defendersBattlePower = this.empireList.find((empire: Empire) => {
                return empire.getOwnerId() === star.getOwner();
            }).getBattlePower();
            var attackersBattlePower = this.empireList.find((empire: Empire) => {
                return empire.getOwnerId() === fleet.getOwner();
            }).getBattlePower();
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
    onJoin(client: Client, empireName: string) {
        this.state.playerIdList.push(client.sessionId);
        this.empireList.push(new Empire(new EmpireState(), this.idGenerator(), empireName, client.sessionId, [], this.state.startingWealth, this.state.startingResearchPoints, this.state.startingSpeed, this.state.startingRange, this.state.startingBattlePower));
    }
}
