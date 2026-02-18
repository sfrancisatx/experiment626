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
exports.EmpireState = void 0;
const schema_1 = require("@colyseus/schema");
class EmpireState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.name = "";
        this.ownerId = "";
        this.wealth = 0;
        this.researchPoints = 0;
        this.speed = 0;
        this.range = 0;
        this.battlePower = 0;
    }
}
exports.EmpireState = EmpireState;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], EmpireState.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], EmpireState.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], EmpireState.prototype, "ownerId", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EmpireState.prototype, "wealth", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EmpireState.prototype, "researchPoints", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EmpireState.prototype, "speed", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EmpireState.prototype, "range", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EmpireState.prototype, "battlePower", void 0);
