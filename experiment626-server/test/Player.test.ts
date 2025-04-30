import { Player } from "../src/rooms/schema/Player";
import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";

describe("Player", () => {
  let player: Player;

  beforeEach(() => {
    player = new Player();
  });

  describe("constructor", () => {
    it("should create a player with default values", () => {
      expect(player.name).to.equal("");
      expect(player.score).to.equal(0);
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
      player.score = 100;
      player.score -= 30;
      expect(player.score).to.equal(70);
    });
  });

  describe("serialization", () => {
    it("should serialize to JSON correctly", () => {
      player.name = "Test Player";
      player.score = 100;

      const json = player.toJSON();
      expect(json).to.deep.equal({
        name: player.name,
        score: player.score
      });
    });
  });
});
