import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadAllMemories, parseMemoryFile, relativeMemoryPath } from "./reader.js";
import { writeMemoryEntry } from "./writer.js";

describe("memory reader", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "agentlayer-reader-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("parses a real memory file", () => {
    const { filePath } = writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/payments",
        task: "handle retries",
        agent: "codex",
        tags: ["payments"],
      },
      content: {
        decision: "Retry on transient failures.",
        reason: "Payment provider returns intermittent 503 responses.",
      },
    });

    const parsed = parseMemoryFile(filePath);

    expect(parsed?.frontmatter.module).toBe("src/payments");
    expect(parsed?.decision).toContain("Retry");
  });

  it("loads indexed memories from disk", () => {
    writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/search",
        task: "rank results",
        agent: "codex",
        tags: ["search", "ranking"],
      },
      content: {
        decision: "Use BM25 before semantic rerank.",
        reason: "Keyword matches should gate the expensive path.",
      },
    });

    const memories = loadAllMemories(tempDir);

    expect(memories).toHaveLength(1);
    expect(memories[0]?.bm25Tokens).toContain("bm25");
    expect(memories[0]?.decayScore).toBeGreaterThan(0.9);
  });

  it("loads global memories and reports a relative path", () => {
    writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "global",
        task: "document ingestion constraint",
        agent: "codex",
        tags: ["global"],
      },
      content: {
        decision: "Prefer queue-based ingestion for analytics events.",
        reason: "It isolates provider spikes from the dashboard read path.",
      },
    });

    const memories = loadAllMemories(tempDir);

    expect(memories).toHaveLength(1);
    expect(memories[0]?.frontmatter.module).toBe("global");
    expect(relativeMemoryPath(tempDir, memories[0]!.filePath).endsWith(".md")).toBe(true);
  });
});
