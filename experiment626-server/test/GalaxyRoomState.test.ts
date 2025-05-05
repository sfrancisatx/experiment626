import { GalaxyRoomState } from "../src/rooms/schema/GalaxyRoomState";
import { Star } from "../src/rooms/schema/Star";
import { Empire } from "../src/rooms/schema/Empire";
import { Player } from "../src/rooms/schema/Player";
import { Fleet } from "../src/rooms/schema/Fleet";
import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { Schema, MapSchema } from "@colyseus/schema";

describe("GalaxyRoomState", () => {
  let state: GalaxyRoomState;

  beforeEach(() => {
    state = new GalaxyRoomState();
  });

  describe("constructor", () => {
    it("should create a state with default values", () => {
      expect(state.stars).to.be.instanceOf(MapSchema);
      expect(state.empires).to.be.instanceOf(MapSchema);
      expect(state.players).to.be.instanceOf(MapSchema);
      expect(state.tick).to.equal(0);
    });

    it("should create empty collections", () => {
      expect(state.stars.size).to.equal(0);
      expect(state.empires.size).to.equal(0);
      expect(state.players.size).to.equal(0);
    });
  });

  describe("stars", () => {
    it("should allow adding stars", () => {
      const star = new Star("test-star", 0, 0);
      state.stars.set(star.id, star);
      expect(state.stars.get(star.id)).to.equal(star);
    });

    it("should allow removing stars", () => {
      const star = new Star("test-star", 0, 0);
      state.stars.set(star.id, star);
      state.stars.delete(star.id);
      expect(state.stars.size).to.equal(0);
    });

    it("should allow getting star count", () => {
      const star1 = new Star("star1", 0, 0);
      const star2 = new Star("star2", 0, 0);
      state.stars.set(star1.id, star1);
      state.stars.set(star2.id, star2);
      expect(state.stars.size).to.equal(2);
    });
  });

  describe("empires", () => {
    it("should allow adding empires", () => {
      const empire = new Empire("Test Empire", "#FF0000");
      state.empires.set(empire.name, empire);
      expect(state.empires.get(empire.name)).to.equal(empire);
    });

    it("should allow removing empires", () => {
      const empire = new Empire("Test Empire", "#FF0000");
      state.empires.set(empire.name, empire);
      state.empires.delete(empire.name);
      expect(state.empires.size).to.equal(0);
    });

    it("should allow getting empire count", () => {
      const empire1 = new Empire("Empire1", "#FF0000");
      const empire2 = new Empire("Empire2", "#00FF00");
      state.empires.set(empire1.name, empire1);
      state.empires.set(empire2.name, empire2);
      expect(state.empires.size).to.equal(2);
    });
  });

  describe("players", () => {
    it("should allow adding players", () => {
      const player = new Player();
      player.name = "Test Player";
      player.score = 100;
      player.name = "Test Player";
      state.players.set(player.name, player);
      expect(state.players.get(player.name)).to.equal(player);
    });

    it("should allow removing players", () => {
      const player = new Player();
      player.name = "Test Player";
      player.score = 100;
      player.name = "Test Player";
      state.players.set(player.name, player);
      state.players.delete(player.name);
      expect(state.players.size).to.equal(0);
    });

    it("should allow getting player count", () => {
      const player1 = new Player();
      player1.name = "Player1";
      const player2 = new Player();
      player2.name = "Player2";
      state.players.set(player1.name, player1);
      state.players.set(player2.name, player2);
      expect(state.players.size).to.equal(2);
    });
  });

  describe("tick", () => {
    it("should allow incrementing tick", () => {
      state.tick = 10;
      expect(state.tick).to.equal(10);
      state.tick += 5;
      expect(state.tick).to.equal(15);
    });

    it("should allow resetting tick", () => {
      state.tick = 100;
      state.tick = 0;
      expect(state.tick).to.equal(0);
    });
  });

  describe("generateGalaxy", () => {
    it("should generate stars with valid positions", () => {
      const numStars = 10;
      state.generateGalaxy(numStars);
      
      expect(state.stars.size).to.equal(numStars);
      
      // Check that stars have valid positions
      for (const [, star] of state.stars.entries()) {
        expect(star.x).to.be.a('number');
        expect(star.y).to.be.a('number');
      }
    });

    it("should generate stars with valid attributes", () => {
      const numStars = 10;
      state.generateGalaxy(numStars);
      
      // Check that stars have valid attributes
      for (const [, star] of state.stars.entries()) {
        expect(star.size).to.be.a('number');
        expect(star.wealth).to.be.a('number');
      }
    });

    it("should generate unique star IDs", () => {
      const numStars = 10;
      state.generateGalaxy(numStars);
      
      const starIds = Array.from(state.stars.keys());
      expect(starIds.length).to.equal(numStars);
      expect(new Set(starIds).size).to.equal(numStars);
    });
  });

  describe("fleets", () => {
    it("should allow creating and managing fleets", () => {
      const empire = new Empire("Test Empire", "#FF0000");
      
      const star1 = new Star("star1", 0, 0);
      const star2 = new Star("star2", 100, 100);
      
      state.stars.set(star1.id, star1);
      state.stars.set(star2.id, star2);
      state.empires.set(empire.name, empire);
      
      // Create a fleet
      const fleet = new Fleet(
        "fleet_1",
        empire.name,
        10, // ships
        1, // speed
        100, // range
        star1.id,
        star2.id,
        state
      );
      
      // Add fleet to state
      state.fleets.set(fleet.id, fleet);
      
      // Check fleet was added
      expect(state.fleets.size).to.equal(1);
      expect(state.fleets.get(fleet.id)).to.equal(fleet);
      
      // Update fleet position
      fleet.updatePosition(0, 1);
      expect(fleet.x).to.be.a('number');
      expect(fleet.y).to.be.a('number');
      
      // Remove fleet
      state.fleets.delete(fleet.id);
      expect(state.fleets.size).to.equal(0);
    });
  });

  describe("serialization", () => {
    it("should serialize to JSON correctly", () => {
      const star = new Star("test-star", 0, 0);
      const empire = new Empire("Test Empire", "#FF0000");
      empire.shipCount = 10;
      const player = new Player("Test Player");
      player.score = 100;

      state.stars.set(star.id, star);
      state.empires.set(empire.name, empire);
      state.players.set(player.name, player);
      state.tick = 10;

      const json = state.toJSON();
      expect(json).to.deep.equal({
        stars: {
          [star.id]: star.toJSON()
        },
        empires: {
          [empire.name]: empire.toJSON()
        },
        players: {
          [player.name]: player.toJSON()
        },
        tick: state.tick,
        timeCompression: state.timeCompression,
        productionCadence: state.productionCadence,
        fleets: state.fleets.toJSON()
      });
    });
  });
});
