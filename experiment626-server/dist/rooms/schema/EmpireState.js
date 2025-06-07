"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpireState = void 0;
const schema_1 = require("@colyseus/schema");
class EmpireState extends schema_1.Schema {
}
exports.EmpireState = EmpireState;
__decorate([
    (0, schema_1.type)("string")
], EmpireState.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("string")
], EmpireState.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)("string")
], EmpireState.prototype, "ownerId", void 0);
__decorate([
    (0, schema_1.type)("number")
], EmpireState.prototype, "wealth", void 0);
__decorate([
    (0, schema_1.type)("number")
], EmpireState.prototype, "researchPoints", void 0);
__decorate([
    (0, schema_1.type)("number")
], EmpireState.prototype, "speed", void 0);
__decorate([
    (0, schema_1.type)("number")
], EmpireState.prototype, "range", void 0);
__decorate([
    (0, schema_1.type)("number")
], EmpireState.prototype, "battlePower", void 0);
