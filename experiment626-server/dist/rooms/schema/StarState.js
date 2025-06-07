"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StarState = void 0;
const schema_1 = require("@colyseus/schema");
class StarState extends schema_1.Schema {
}
exports.StarState = StarState;
__decorate([
    (0, schema_1.type)("string")
], StarState.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("string")
], StarState.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)("string")
], StarState.prototype, "owner", void 0);
__decorate([
    (0, schema_1.type)("number")
], StarState.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number")
], StarState.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("number")
], StarState.prototype, "wealthProduction", void 0);
__decorate([
    (0, schema_1.type)("number")
], StarState.prototype, "shipProduction", void 0);
__decorate([
    (0, schema_1.type)("number")
], StarState.prototype, "shipCount", void 0);
