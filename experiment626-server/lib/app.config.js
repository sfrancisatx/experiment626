"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = __importDefault(require("@colyseus/tools"));
const monitor_1 = require("@colyseus/monitor");
const playground_1 = require("@colyseus/playground");
const path_1 = __importDefault(require("path"));
//import serveIndex from 'serve-index';
const express_1 = __importDefault(require("express"));
/**
 * Import your Room files
 */
const Galaxy_1 = require("./rooms/Galaxy");
const Lobby_1 = require("./rooms/Lobby");
exports.default = (0, tools_1.default)({
    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define("game_room", Galaxy_1.Galaxy);
        gameServer.define("lobby", Lobby_1.LobbyRoom);
    },
    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */
        app.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });
        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== "production") {
            app.use("/", (0, playground_1.playground)());
        }
        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/monitor", (0, monitor_1.monitor)());
        // this was in the sample app but i honestly don't know what it does :)
        //  app.use('/', serveIndex(path.join(__dirname, "static"),{'icons': true}));
        /* SLF
         * this next command allows the app to use the static subdirectory (and therefore to "See" html pages in that directory)
         */
        app.use('/', express_1.default.static(path_1.default.join(__dirname, "static")));
    },
    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
