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
exports.PlayerViewState = void 0;
const schema_1 = require("@colyseus/schema");
const StarState_1 = require("./StarState");
const FleetState_1 = require("./FleetState");
const schema_2 = require("@colyseus/schema");
class PlayerViewState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.starList = new schema_2.ArraySchema();
        this.fleetList = new schema_2.ArraySchema();
        this.sessionId = "";
    }
}
exports.PlayerViewState = PlayerViewState;
__decorate([
    (0, schema_1.type)([StarState_1.StarState]),
    __metadata("design:type", schema_2.ArraySchema)
], PlayerViewState.prototype, "starList", void 0);
__decorate([
    (0, schema_1.type)([FleetState_1.FleetState]),
    __metadata("design:type", schema_2.ArraySchema)
], PlayerViewState.prototype, "fleetList", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], PlayerViewState.prototype, "sessionId", void 0);
