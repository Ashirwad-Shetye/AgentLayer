import { describe, expect, it } from "vitest";
import { parseLogArguments, parseQueryArguments } from "./tool-arguments.js";

describe("tool argument parsing", () => {
  it("accepts legacy query arguments", () => {
    const parsed = parseQueryArguments({
      query: "Why polling?",
      module: "src/dashboard",
      intent: "understand",
    });

    expect(parsed.value).toEqual({
      query: "Why polling?",
      module: "src/dashboard",
      intent: "understand",
    });
  });

  it("rejects missing query text", () => {
    const parsed = parseQueryArguments({ module: "src/dashboard" });

    expect(parsed.value).toBeUndefined();
    expect(parsed.error).toContain("query");
  });

  it("accepts rich log arguments", () => {
    const parsed = parseLogArguments({
      decision: "Use polling for dashboard analytics.",
      reason: "Provider events are incomplete.",
      module: "src/dashboard",
      rejected: "Webhook-only refresh.",
      tradeoffAccepted: "Refresh may lag by a few seconds.",
      open: "Revisit when provider events improve.",
      reusablePattern: "Use bounded polling for incomplete upstream events.",
      tags: ["dashboard", "analytics"],
    });

    expect(parsed.value?.tradeoffAccepted).toContain("lag");
    expect(parsed.value?.open).toContain("Revisit");
    expect(parsed.value?.reusablePattern).toContain("bounded polling");
  });

  it("rejects missing log essentials", () => {
    const parsed = parseLogArguments({ decision: "Use polling." });

    expect(parsed.value).toBeUndefined();
    expect(parsed.error).toContain("reason");
  });
});
