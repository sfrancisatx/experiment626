import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { Fleet } from "../src/rooms/schema/Fleet";
import { GalaxyRoomState } from "../src/rooms/schema/GalaxyRoomState";
import { Star } from "../src/rooms/schema/Star";

describe("Fleet", () => {
  let fleet: Fleet;
  let state: GalaxyRoomState;
  let startStar: Star;
  let destinationStar: Star;
  const testId = "fleet123";
  const ownerEmpire = "empire1";
  const tickDuration = 1;

  beforeEach(() => {
    state = new GalaxyRoomState();
    startStar = new Star("start", 0, 0);
    destinationStar = new Star("destination", 100, 100);
    state.stars.set(startStar.id, startStar);
    state.stars.set(destinationStar.id, destinationStar);

    fleet = new Fleet(
      testId,
      ownerEmpire,
      100,
      10,
      1000,
      startStar.id,
      destinationStar.id,
      state
    );
  });

  describe("constructor", () => {
    it("should create a fleet with default values", () => {
      expect(fleet.id).to.equal(testId);
      expect(fleet.owner).to.equal(ownerEmpire);
      expect(fleet.ships).to.equal(100);
      expect(fleet.speed).to.equal(10);
      expect(fleet.range).to.equal(1000);
      expect(fleet.startingPoint).to.equal(startStar.id);
      expect(fleet.endPoint).to.equal(destinationStar.id);
      expect(fleet.x).to.equal(0);
      expect(fleet.y).to.equal(0);
      expect(fleet.eta).to.equal(0);
      expect(fleet.isGarrisoned).to.be.false;
    });

    it("should initialize with valid room state", () => {
      expect(fleet.galaxyState).to.equal(state);
    });
  });

  // Describe block for updatePosition
  describe("updatePosition", () => {
    it("should update position based on speed and direction", () => {
      const initialX = fleet.x;
      const initialY = fleet.y;
      
      fleet.updatePosition(0, tickDuration);
      
      // Fleet should move in the direction of the destination
      expect(fleet.x).to.be.greaterThan(initialX);
      expect(fleet.y).to.be.greaterThan(initialY);
      
      // Should move by speed * tickDuration
      const distanceMoved = Math.sqrt(
        Math.pow(fleet.x - initialX, 2) +
        Math.pow(fleet.y - initialY, 2)
      );
      expect(distanceMoved).to.be.closeTo(fleet.speed * tickDuration, 0.01);
    });
    

    it("should not move if garrisoned", () => {
      fleet.garrison();
      const initialX = fleet.x;
      const initialY = fleet.y;
      
      fleet.updatePosition(0, tickDuration);
      
      expect(fleet.x).to.equal(initialX);
      expect(fleet.y).to.equal(initialY);
    });

    it("should not move if destination is not found", () => {
      const initialX = fleet.x;
      const initialY = fleet.y;
      fleet.endPoint = "nonexistent";
      fleet.updatePosition(0, tickDuration);
      expect(fleet.x).to.equal(initialX);
      expect(fleet.y).to.equal(initialY);
    });
  });
  

  describe("updateETA", () => {
    it("should calculate ETA based on remaining distance", () => {
      const initialX = fleet.x;
      const initialY = fleet.y;
      fleet.endPoint = destinationStar.id;
      fleet.updateETA(0, tickDuration);
      const distance = Math.sqrt(
        Math.pow(destinationStar.x - initialX, 2) +
        Math.pow(destinationStar.y - initialY, 2)
      );
      const expectedETA = distance / (fleet.speed * tickDuration);
      expect(fleet.eta).to.be.closeTo(expectedETA, 0.01);
    });

    it("should not update ETA if destination is not found", () => {
      const initialETA = fleet.eta;
      fleet.endPoint = "nonexistent";
      fleet.updateETA(0, tickDuration);
      expect(fleet.eta).to.equal(initialETA);
    });
  });

  describe("garrisoning", () => {
    it("should allow garrisoning and ungarrisoning", () => {
      expect(fleet.isGarrisoned).to.be.false;
      
      fleet.garrison();
      expect(fleet.isGarrisoned).to.be.true;
      
      fleet.ungarrison();
      expect(fleet.isGarrisoned).to.be.false;
    });

    it("should affect fleet movement", () => {
      fleet.garrison();
      const initialX = fleet.x;
      const initialY = fleet.y;
      
      fleet.updatePosition(0, tickDuration);
      
      expect(fleet.x).to.equal(initialX);
      expect(fleet.y).to.equal(initialY);
      
      fleet.ungarrison();
      fleet.updatePosition(0, tickDuration);
      
      expect(fleet.x).to.be.greaterThan(initialX);
      expect(fleet.y).to.be.greaterThan(initialY);
    });
  });

  describe("serialization", () => {
    it("should serialize to JSON correctly", () => {
      const json = fleet.toJSON();
      const expected = {
        id: testId,
        owner: ownerEmpire,
        ships: 100,
        speed: 10,
        range: 1000,
        startingPoint: startStar.id,
        endPoint: destinationStar.id,
        x: fleet.x,
        y: fleet.y,
        eta: fleet.eta,
        isGarrisoned: false
      };
      // Remove galaxyState from JSON since it's not serializable
      const serialized = { ...json };
      delete serialized.galaxyState;
      expect(serialized).to.deep.equal(expected);
    });
  });
});
