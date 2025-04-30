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
      expect(star.resources).to.equal(0);
    });
  });

  describe("generateAttributes", () => {
    it("should generate valid star attributes", () => {
      star.generateAttributes();
      
      expect(star.size).to.be.at.least(1).and.at.most(5);
      expect(star.resources).to.be.at.least(10).and.at.most(100);
    });

    it("should generate different attributes on multiple calls", () => {
      const attrs1 = {
        size: star.size,
        resources: star.resources
      };
      
      star.generateAttributes();
      
      const attrs2 = {
        size: star.size,
        resources: star.resources
      };
      
      expect(attrs1).to.not.deep.equal(attrs2);
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
  });
});
