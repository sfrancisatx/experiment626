import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { Empire } from "../src/rooms/schema/Empire";
import { Star } from "../src/rooms/schema/Star";
import { Player } from "../src/rooms/schema/Player";
import { MapSchema, ArraySchema } from "@colyseus/schema";

describe("Empire", () => {
  let empire: Empire;
  let nextId = 0;
  let star1: Star;
  let star2: Star;
  let player: Player;
  let stars: MapSchema<Star>;

  beforeEach(() => {
    empire = new Empire("Test Empire", "#FF0000");
    // Generate an ID for the empire
    empire.id = `empire${nextId++}`;
    star1 = new Star("star1", 10, 20);
    star2 = new Star("star2", 30, 40);
    star1.wealth = 100;
    star2.wealth = 150;
    stars = new MapSchema<Star>();
    stars.set(star1.id, star1);
    stars.set(star2.id, star2);
    player = new Player();
  });

  describe("constructor", () => {
    it("should create an empire with default values", () => {
      expect(empire.name).to.equal("Test Empire");
      expect(empire.color).to.equal("#FF0000");
      expect(empire.totalResources).to.equal(0);
      expect(empire.researchPoints).to.equal(0);
      expect(empire.shipCount).to.equal(0);
      expect(empire.shipProductionRate).to.equal(1);
      expect(empire.controlledStars.toArray()).to.deep.equal([]);
      expect(empire.leader).to.be.null;
    });
  });

  describe("updateResources", () => {
    it("should calculate total resources from controlled stars", () => {
      empire.addStar(star1.id);
      empire.addStar(star2.id);
      empire.updateResources(stars);
      expect(empire.totalResources).to.equal(250); // 100 + 150
    });

    it("should handle stars that no longer exist", () => {
      empire.addStar("nonexistent");
      empire.updateResources(stars);
      expect(empire.totalResources).to.equal(0);
    });
  });

  describe("star management", () => {
    it("should add a star to controlled stars", () => {
      empire.addStar(star1.id);
      expect(empire.controlledStars.toArray()).to.deep.equal([star1.id]);
    });

    it("should not add duplicate stars", () => {
      empire.addStar(star1.id);
      empire.addStar(star1.id);
      expect(empire.controlledStars.toArray()).to.deep.equal([star1.id]);
    });

    it("should remove a star from controlled stars", () => {
      empire.addStar(star1.id);
      empire.removeStar(star1.id);
      expect(empire.controlledStars.toArray()).to.deep.equal([]);
    });

    it("should handle removing non-existent stars", () => {
      empire.removeStar("nonexistent");
      expect(empire.controlledStars.toArray()).to.deep.equal([]);
    });
  });

  describe("leader management", () => {
    it("should set a player as leader", () => {
      empire.leader = player;
      expect(empire.leader).to.equal(player);
    });

    it("should clear leader", () => {
      empire.leader = player;
      empire.leader = null;
      expect(empire.leader).to.be.null;
    });
  });

  describe("serialization", () => {
    it("should serialize to JSON correctly", () => {
      empire.addStar(star1.id);
      empire.addStar(star2.id);
      empire.leader = player;
      
      const serialized = empire.toJSON();
      expect(serialized).to.have.all.keys(
        "id",
        "name",
        "color",
        "totalResources",
        "researchPoints",
        "shipCount",
        "shipProductionRate",
        "homeStar",
        "controlledStars",
        "leader"
      );
      
      // Verify controlledStars is serialized correctly
      expect(serialized.controlledStars).to.deep.equal([star1.id, star2.id]);
    });
  });
});
