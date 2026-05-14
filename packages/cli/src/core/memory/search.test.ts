import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadAllMemories } from "./reader.js";
import { compileRetrievalQuery } from "./retrieval-query.js";
import { searchMemory } from "./search.js";
import { writeMemoryEntry } from "./writer.js";
import { bm25Filter } from "../optimizer/bm25.js";

describe("memory search", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "agentlayer-search-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("preserves legacy raw-query retrieval", async () => {
    writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/auth",
        task: "rotate auth tokens",
        agent: "codex",
        tags: ["auth", "tokens"],
      },
      content: {
        decision: "Use short-lived access tokens with refresh rotation.",
        reason: "It reduced replay exposure and fit our invalidation flow.",
      },
    });

    const result = await searchMemory({
      memoryRepo: tempDir,
      query: "Why did auth token rotation change?",
      module: "src/auth",
      intent: "debug",
    });

    expect(result).toContain("src/auth");
    expect(result).toContain("Use short-lived access tokens");
  });

  it("uses richer structured retrieval context to improve ranking", () => {
    writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/dashboard",
        task: "dashboard analytics refresh strategy",
        agent: "codex",
        tags: ["dashboard", "analytics", "polling"],
      },
      content: {
        decision: "Use polling for dashboard analytics refresh.",
        reason:
          "Dashboard reads tolerate short staleness and the webhook design was rejected due to third-party event drift.",
      },
    });

    writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/ops",
        task: "worker heartbeat checks",
        agent: "codex",
        tags: ["polling", "ops"],
      },
      content: {
        decision: "Use polling for heartbeat checks.",
        reason:
          "Polling keeps heartbeat intervals predictable and the polling loop is simple to operate.",
      },
    });

    const memories = loadAllMemories(tempDir);
    const legacyQuery = compileRetrievalQuery({ query: "Why polling?" });
    const structuredQuery = compileRetrievalQuery({
      query: "Why polling?",
      retrieval: {
        question: "Why polling?",
        task: "Update dashboard analytics refresh flow",
        module: "src/dashboard",
        keywords: ["webhooks", "analytics", "refresh cadence"],
        phase: "implementation",
        intent: "understand",
      },
    });

    const legacyResults = bm25Filter(legacyQuery.searchText, memories, 10);
    const structuredResults = bm25Filter(structuredQuery.searchText, memories, 10);

    expect(legacyResults.some((memory) => memory.frontmatter.module === "src/dashboard")).toBe(true);
    expect(structuredResults[0]?.frontmatter.module).toBe("src/dashboard");
  });

  it("searches rich memory sections and respects module boundaries", async () => {
    writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/auth",
        task: "auth rotation",
        agent: "codex",
        tags: [],
      },
      content: {
        decision: "Keep token refresh deterministic.",
        reason: "The active session table owns invalidation.",
        tradeoffAccepted: "Rotation may keep a short stale window.",
        reusablePattern: "Prefer explicit invalidation checks before session refresh.",
      },
    });

    writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/authentication",
        task: "different module",
        agent: "codex",
        tags: ["stale"],
      },
      content: {
        decision: "This should not match the src/auth module filter.",
        reason: "It is a sibling module with a shared prefix.",
      },
    });

    const result = await searchMemory({
      memoryRepo: tempDir,
      query: "stale invalidation pattern",
      module: "src/auth",
      intent: "understand",
    });

    expect(result).toContain("src/auth");
    expect(result).toContain("PATTERN: Prefer explicit invalidation checks");
    expect(result).not.toContain("src/authentication");
  });
});
