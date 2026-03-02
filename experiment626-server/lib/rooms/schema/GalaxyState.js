"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalaxyState = void 0;
const schema_1 = require("@colyseus/schema");
class GalaxyState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.clockTime = 0;
        this.id = "";
        this.playerIdList = new schema_1.ArraySchema();
        this.startingSpeed = 0;
        this.startingRange = 0;
        this.startingBattlePower = 0;
        this.startingWealth = 0;
        this.startingStars = 0;
        this.startingShips = 0;
        this.factoryCost = 0;
        this.startingSpeedCost = 0;
        this.startingRangeCost = 0;
        this.startingBattlePowerCost = 0;
        this.vpId = "";
        this.size = "itty";
        this.minimumDistanceBetweenStars = 5;
        this.visibilityLevel = 0;
    }
}
exports.GalaxyState = GalaxyState;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "clockTime", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], GalaxyState.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)(["string"]),
    __metadata("design:type", schema_1.ArraySchema)
], GalaxyState.prototype, "playerIdList", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "startingSpeed", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "startingRange", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "startingBattlePower", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "startingWealth", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "startingStars", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "startingShips", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "factoryCost", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "startingSpeedCost", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "startingRangeCost", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "startingBattlePowerCost", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], GalaxyState.prototype, "vpId", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], GalaxyState.prototype, "size", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "minimumDistanceBetweenStars", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxyState.prototype, "visibilityLevel", void 0);
