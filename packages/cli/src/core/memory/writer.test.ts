import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseMemoryFile } from "./reader.js";
import { writeMemoryEntry } from "./writer.js";

describe("writeMemoryEntry", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "agentlayer-memory-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("writes a memory entry that can be read back", () => {
    const result = writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/auth",
        task: "switch token strategy",
        agent: "codex",
        tags: ["auth", "token"],
      },
      content: {
        decision: "Switch to short-lived access tokens.",
        reason: "Reduce replay risk and simplify rotation.",
        rejected: "Long-lived bearer tokens",
      },
    });

    const parsed = parseMemoryFile(result.filePath);

    expect(parsed).not.toBeNull();
    expect(parsed?.decision).toBe("Switch to short-lived access tokens.");
    expect(parsed?.reason).toBe("Reduce replay risk and simplify rotation.");
    expect(parsed?.rejected).toBe("Long-lived bearer tokens");
    expect(parsed?.frontmatter.module).toBe("src/auth");
    expect(parsed?.frontmatter.tags).toEqual(["auth", "token"]);
  });

  it("appends an index entry to index.jsonl", () => {
    writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/api",
        task: "first task",
        agent: "codex",
        tags: [],
      },
      content: {
        decision: "Decision one",
        reason: "Reason one",
      },
    });

    writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: "src/ui",
        task: "second task",
        agent: "codex",
        tags: [],
      },
      content: {
        decision: "Decision two",
        reason: "Reason two",
      },
    });

    const lines = readFileSync(join(tempDir, "index.jsonl"), "utf-8")
      .trim()
      .split("\n");

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0] ?? "{}").module).toBe("src/api");
    expect(JSON.parse(lines[1] ?? "{}").module).toBe("src/ui");
  });
});
