import { describe, expect, it } from "vitest";
import { findSensitive } from "./sensitive";

describe("findSensitive", () => {
  it("passes ordinary prompts", () => {
    expect(
      findSensitive("Write a 120-word launch email for a coffee subscription. Offer 20% off."),
    ).toEqual([]);
    expect(findSensitive("Summarize {text} in 3 bullet points for 2026 planning")).toEqual([]);
  });

  it("flags emails, phone numbers and passwords", () => {
    expect(findSensitive("Reply to priya.sharma@acme.co about the refund")).toEqual([
      "an email address",
    ]);
    expect(findSensitive("Call me on +91 98765 43210")).toEqual(["a phone number"]);
    expect(findSensitive("login with password: hunter22")).toEqual(["a password"]);
  });

  it("flags API keys", () => {
    expect(findSensitive("use sk-proj-abcdefghijklmnopqrstuvwx to call it")).toEqual([
      "an API key or token",
    ]);
    expect(findSensitive("key AKIAIOSFODNN7EXAMPLE")).toEqual(["an API key or token"]);
  });

  it("flags a real card number once, not as a phone number", () => {
    expect(findSensitive("charge 4111 1111 1111 1111")).toEqual(["a card number"]);
  });
});
