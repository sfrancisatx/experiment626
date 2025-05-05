import { Player } from "../src/rooms/schema/Player";
import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";

describe("Player", () => {
  let player: Player;
  const testId = "player123";

  beforeEach(() => {
    player = new Player();
  });

  describe("constructor", () => {
    it("should create a player with default values", () => {
      expect(player.name).to.equal("");
      expect(player.score).to.equal(0);
    });

    it("should initialize with provided ID", () => {
      const playerWithId = new Player();
      playerWithId.id = testId;
      expect(playerWithId.id).to.equal(testId);
    });
  });

  describe("id", () => {
    it("should allow setting an ID", () => {
      player.id = testId;
      expect(player.id).to.equal(testId);
    });

    it("should allow clearing ID", () => {
      player.id = "";
      expect(player.id).to.equal("");
    });

    it("should maintain ID type as string", () => {
      player.id = testId;
      expect(typeof player.id).to.equal("string");
    });
  });

  describe("name", () => {
    it("should allow setting a name", () => {
      const name = "Test Player";
      player.name = name;
      expect(player.name).to.equal(name);
    });

    it("should allow clearing name", () => {
      player.name = "";
      expect(player.name).to.equal("");
    });

    it("should maintain name type as string", () => {
      player.name = "Test Player";
      expect(typeof player.name).to.equal("string");
    });

    it("should handle long names", () => {
      const longName = "a".repeat(100);
      player.name = longName;
      expect(player.name).to.equal(longName);
    });
  });

  describe("score", () => {
    it("should allow setting a score", () => {
      const score = 100;
      player.score = score;
      expect(player.score).to.equal(score);
    });

    it("should allow setting a negative score", () => {
      const score = -50;
      player.score = score;
      expect(player.score).to.equal(score);
    });

    it("should allow incrementing score", () => {
      player.score = 50;
      player.score += 25;
      expect(player.score).to.equal(75);
    });

    it("should allow decrementing score", () => {
      player.score = 50;
      player.score -= 25;
      expect(player.score).to.equal(25);
    });

    it("should maintain score as number", () => {
      player.score = 100;
      expect(typeof player.score).to.equal("number");
    });

    it("should handle large numbers", () => {
      const largeNumber = 1000000000;
      player.score = largeNumber;
      expect(player.score).to.equal(largeNumber);
    });

    it("should handle decimal numbers", () => {
      const decimal = 100.5;
      player.score = decimal;
      expect(player.score).to.equal(decimal);
    });
  });

  describe("serialization", () => {
    it("should serialize to JSON correctly", () => {
      player.id = testId;
      player.name = "Test Player";
      player.score = 100;
      
      const json = player.toJSON();
      expect(json).to.deep.equal({
        id: testId,
        name: "Test Player",
        score: 100
      });
    });

    it("should handle empty properties in serialization", () => {
      const json = player.toJSON();
      expect(json).to.deep.equal({
        name: "",
        score: 0
      });
    });
  });
});
