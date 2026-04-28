import { describe, expect, it } from "vitest";
import type { IndexedMemory } from "@agentlayer/shared";
import { bm25Filter } from "./bm25.js";

function memory(
  moduleName: string,
  decision: string,
  tokens: string[],
): IndexedMemory {
  return {
    id: moduleName,
    frontmatter: {
      date: "2026-04-28",
      module: moduleName,
      task: decision,
      developer: "test",
      agent: "codex",
      tags: [],
    },
    decision,
    reason: decision,
    rawMarkdown: decision,
    filePath: `/tmp/${moduleName}.md`,
    bm25Tokens: tokens,
    decayScore: 1,
  };
}

describe("bm25Filter", () => {
  it("ranks the most relevant memory first", () => {
    const results = bm25Filter(
      "auth token rotation",
      [
        memory("src/auth", "rotate tokens", ["auth", "token", "rotation"]),
        memory("src/ui", "button spacing", ["button", "spacing", "layout"]),
      ],
      10,
    );

    expect(results[0]?.frontmatter.module).toBe("src/auth");
  });

  it("returns an empty list when nothing matches", () => {
    const results = bm25Filter(
      "payments webhook",
      [memory("src/ui", "button spacing", ["button", "spacing"])],
      10,
    );

    expect(results).toEqual([]);
  });
});
