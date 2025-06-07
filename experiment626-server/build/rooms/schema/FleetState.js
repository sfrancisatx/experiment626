"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetState = void 0;
const schema_1 = require("@colyseus/schema");
class FleetState extends schema_1.Schema {
}
exports.FleetState = FleetState;
__decorate([
    (0, schema_1.type)("string")
], FleetState.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("string")
], FleetState.prototype, "owner", void 0);
__decorate([
    (0, schema_1.type)("string")
], FleetState.prototype, "sourceStarId", void 0);
__decorate([
    (0, schema_1.type)("string")
], FleetState.prototype, "destinationStarId", void 0);
__decorate([
    (0, schema_1.type)("number")
], FleetState.prototype, "ships", void 0);
__decorate([
    (0, schema_1.type)("number")
], FleetState.prototype, "startTime", void 0);
__decorate([
    (0, schema_1.type)("number")
], FleetState.prototype, "endTime", void 0);
