import { describe, it, expect } from "@jest/globals";
import { isValidJson, parseJson, safeParseJson } from "../../utils/jsonParser.js";

describe("jsonParser utils", () => {
  describe("parseJson", () => {
    it("parses a valid JSON string", () => {
      expect(parseJson('{"topic":"node"}')).toEqual({ topic: "node" });
    });

    it("parses JSON wrapped in code fences", () => {
      const raw = "```json\n{\"level\":\"advanced\"}\n```";
      expect(parseJson(raw)).toEqual({ level: "advanced" });
    });

    it("throws when input is empty", () => {
      expect(() => parseJson("")).toThrow("Empty AI output");
    });
  });

  describe("safeParseJson", () => {
    it("returns fallback on invalid JSON", () => {
      const fallback = [];
      expect(safeParseJson("not-json", fallback)).toBe(fallback);
    });
  });

  describe("isValidJson", () => {
    it("returns true for valid JSON", () => {
      expect(isValidJson('{"ok":true}')).toBe(true);
    });

    it("returns false for invalid JSON", () => {
      expect(isValidJson("{nope")).toBe(false);
    });
  });
});
