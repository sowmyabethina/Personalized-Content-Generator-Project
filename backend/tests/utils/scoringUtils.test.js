import { describe, it, expect } from "@jest/globals";
import {
  calculatePercentage,
  classifyBaseLevel,
  classifyBoostedLevel,
} from "../../utils/scoringUtils.js";

describe("scoringUtils", () => {
  describe("calculatePercentage", () => {
    it("calculates rounded percentage", () => {
      expect(calculatePercentage(2, 3)).toBe(66.67);
    });

    it("caps values to 100", () => {
      expect(calculatePercentage(9, 5)).toBe(100);
    });

    it("throws for invalid total input", () => {
      expect(() => calculatePercentage(1, 0)).toThrow(TypeError);
    });
  });

  describe("classifyBaseLevel", () => {
    it("classifies beginner/intermediate/advanced correctly", () => {
      expect(classifyBaseLevel(20)).toBe("Beginner");
      expect(classifyBaseLevel(60)).toBe("Intermediate");
      expect(classifyBaseLevel(95)).toBe("Advanced");
    });
  });

  describe("classifyBoostedLevel", () => {
    it("uses boosted thresholds correctly", () => {
      expect(classifyBoostedLevel(30)).toBe("Beginner");
      expect(classifyBoostedLevel(70)).toBe("Intermediate");
      expect(classifyBoostedLevel(90)).toBe("Advanced");
    });

    it("throws on invalid input", () => {
      expect(() => classifyBoostedLevel(Number.NaN)).toThrow(TypeError);
    });
  });
});
