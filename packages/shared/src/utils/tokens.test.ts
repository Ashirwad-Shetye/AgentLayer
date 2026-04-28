import { describe, expect, it } from "vitest";
import { estimateTokens, truncateToTokenBudget } from "./tokens.js";

describe("token utilities", () => {
  it("estimates tokens using the four-char heuristic", () => {
    expect(estimateTokens("12345678")).toBe(2);
  });

  it("truncates text to the requested token budget", () => {
    const result = truncateToTokenBudget("abcdefghijklmnop", 2);
    expect(result).toContain("[truncated to fit token budget]");
  });
});
