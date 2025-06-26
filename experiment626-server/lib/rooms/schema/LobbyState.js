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
exports.LobbyState = exports.GalaxySummary = exports.LobbyPlayer = void 0;
const schema_1 = require("@colyseus/schema");
class LobbyPlayer extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.name = "";
        this.sessionId = "";
        this.email = "";
    }
}
exports.LobbyPlayer = LobbyPlayer;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], LobbyPlayer.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], LobbyPlayer.prototype, "sessionId", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], LobbyPlayer.prototype, "email", void 0);
class GalaxySummary extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.roomId = "";
        this.name = "";
        this.status = "open"; // e.g. open, in-progress
        this.playerCount = 0;
    }
}
exports.GalaxySummary = GalaxySummary;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], GalaxySummary.prototype, "roomId", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], GalaxySummary.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], GalaxySummary.prototype, "status", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GalaxySummary.prototype, "playerCount", void 0);
class LobbyState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.galaxies = new schema_1.ArraySchema();
    }
}
exports.LobbyState = LobbyState;
__decorate([
    (0, schema_1.type)({ map: LobbyPlayer }),
    __metadata("design:type", Object)
], LobbyState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)([GalaxySummary]),
    __metadata("design:type", Object)
], LobbyState.prototype, "galaxies", void 0);
