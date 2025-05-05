import { Star } from "../src/rooms/schema/Star";
import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";

describe("Star", () => {
  let star: Star;
  const testX = 50;
  const testY = 50;

  beforeEach(() => {
    star = new Star("test-star", testX, testY);
  });

  describe("constructor", () => {
    it("should create a star with the correct ID", () => {
      expect(star.id).to.equal("test-star");
    });

    it("should initialize coordinates with specified values", () => {
      expect(star.x).to.equal(testX);
      expect(star.y).to.equal(testY);
    });

    it("should initialize default values", () => {
      expect(star.size).to.equal(1);
      expect(star.owner).to.equal("");
      expect(star.wealth).to.equal(0);
      expect(star.numShips).to.equal(0);
      expect(star.isDead).to.be.false;
      expect(star.empireID).to.equal("");
    });
  });

  describe("generateAttributes", () => {
    it("should generate valid star attributes", () => {
      star.generateAttributes();
      
      expect(star.size).to.be.at.least(1).and.at.most(5);
      expect(star.wealth).to.be.at.least(100).and.at.most(1000);
      expect(star.numShips).to.be.at.least(1).and.at.most(10);
    });

    it("should generate different attributes on multiple calls", () => {
      const attrs1 = {
        size: star.size,
        wealth: star.wealth,
        numShips: star.numShips
      };
      
      star.generateAttributes();
      
      const attrs2 = {
        size: star.size,
        wealth: star.wealth,
        numShips: star.numShips
      };
      
      expect(attrs1).to.not.deep.equal(attrs2);
    });
  });

  describe("generatePosition", () => {
    it("should generate position within specified bounds", () => {
      const minX = 100;
      const maxX = 200;
      const minY = 150;
      const maxY = 250;
      
      star.generatePosition(minX, maxX, minY, maxY);
      
      expect(star.x).to.be.at.least(minX).and.at.most(maxX);
      expect(star.y).to.be.at.least(minY).and.at.most(maxY);
    });

    it("should handle edge cases", () => {
      star.generatePosition(0, 0, 0, 0);
      expect(star.x).to.equal(0);
      expect(star.y).to.equal(0);

      star.generatePosition(100, 100, 200, 200);
      expect(star.x).to.equal(100);
      expect(star.y).to.equal(200);
    });
  });

  describe("ownership", () => {
    it("should allow setting a new owner", () => {
      const ownerId = "player1";
      star.owner = ownerId;
      expect(star.owner).to.equal(ownerId);
    });

    it("should allow clearing owner", () => {
      star.owner = "";
      expect(star.owner).to.equal("");
    });

    it("should allow setting empire ID", () => {
      const empireId = "empire1";
      star.empireID = empireId;
      expect(star.empireID).to.equal(empireId);
    });
  });

  describe("state management", () => {
    it("should allow marking star as dead", () => {
      star.isDead = true;
      expect(star.isDead).to.be.true;
    });

    it("should allow updating number of ships", () => {
      star.numShips = 5;
      expect(star.numShips).to.equal(5);
    });
  });
});
