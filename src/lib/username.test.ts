import { describe, expect, it } from "vitest";
import { deriveUsername, withSuffix } from "./username";

describe("deriveUsername", () => {
  it("prefers the Clerk username", () => {
    expect(deriveUsername("Zaid_Dev", "x@example.com")).toBe("zaid_dev");
  });

  it("falls back to the email local part and strips invalid characters", () => {
    expect(deriveUsername(null, "mohd.zaid+test@example.com")).toBe("mohd_zaid_test");
  });

  it("pads very short handles", () => {
    expect(deriveUsername(null, "a@example.com").length).toBeGreaterThanOrEqual(3);
  });

  it("caps length", () => {
    expect(deriveUsername("a".repeat(60), "x@example.com")).toHaveLength(24);
  });
});

describe("withSuffix", () => {
  it("stays within the length cap", () => {
    expect(withSuffix("a".repeat(24)).length).toBeLessThanOrEqual(24);
  });
});
