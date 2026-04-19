import { describe, it, expect } from "vitest";
import { AIOutputSchema } from "../src/types";

describe("Semantic Validation", () => {
  it("passes valid conventional commits", () => {
    const valid = {
      title: "feat(api): add login endpoint",
      description: "This adds a new login route.",
    };
    expect(AIOutputSchema.parse(valid)).toBeTruthy();
  });

  it("fails non-semantic titles", () => {
    const invalid = { title: "updated some stuff", description: "too short" };
    expect(() => AIOutputSchema.parse(invalid)).toThrow();
  });
});
