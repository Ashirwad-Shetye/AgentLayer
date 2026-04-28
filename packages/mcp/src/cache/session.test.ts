import { describe, expect, it } from "vitest";
import { SessionCache } from "./session.js";

describe("SessionCache", () => {
  it("returns cached entries", () => {
    const cache = new SessionCache();
    cache.set("auth:understand", "cached result");

    expect(cache.get("auth:understand")).toBe("cached result");
  });

  it("tracks cache hit statistics", () => {
    const cache = new SessionCache();
    cache.set("payments:extend", "value");
    cache.get("payments:extend");
    cache.get("payments:extend");

    expect(cache.stats()).toEqual({
      entries: 1,
      totalHits: 2,
    });
  });
});
