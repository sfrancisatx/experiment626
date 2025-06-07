"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalaxyState = void 0;
const schema_1 = require("@colyseus/schema");
class GalaxyState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.clockTime = 0;
        this.playerIdList = [];
        // @type(StarState) starStateList: StarState[] = [];
        // @type(FleetState) fleetStateList: FleetState[] = [];
        // @type(EmpireState) empireStateList: EmpireState[] = [];
        this.startingResearchPoints = 0;
        this.startingSpeed = 0;
        this.startingRange = 0;
        this.startingBattlePower = 0;
        this.startingWealth = 0;
        this.startingStars = 0;
        this.startingShips = 0;
        this.vpId = "";
    }
}
exports.GalaxyState = GalaxyState;
__decorate([
    (0, schema_1.type)("number")
], GalaxyState.prototype, "clockTime", void 0);
__decorate([
    (0, schema_1.type)("string")
], GalaxyState.prototype, "playerIdList", void 0);
__decorate([
    (0, schema_1.type)("number")
], GalaxyState.prototype, "startingResearchPoints", void 0);
__decorate([
    (0, schema_1.type)("number")
], GalaxyState.prototype, "startingSpeed", void 0);
__decorate([
    (0, schema_1.type)("number")
], GalaxyState.prototype, "startingRange", void 0);
__decorate([
    (0, schema_1.type)("number")
], GalaxyState.prototype, "startingBattlePower", void 0);
__decorate([
    (0, schema_1.type)("number")
], GalaxyState.prototype, "startingWealth", void 0);
__decorate([
    (0, schema_1.type)("number")
], GalaxyState.prototype, "startingStars", void 0);
__decorate([
    (0, schema_1.type)("number")
], GalaxyState.prototype, "startingShips", void 0);
__decorate([
    (0, schema_1.type)("string")
], GalaxyState.prototype, "vpId", void 0);
