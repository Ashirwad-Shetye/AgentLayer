import { execSync } from "child_process";
import { existsSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { Command } from "commander";
import { registerInit } from "./init.js";

describe("agentlayer init", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "agentlayer-init-"));
    execSync("git init", { cwd: tempDir, encoding: "utf-8" });
    vi.spyOn(process, "cwd").mockReturnValue(tempDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates project-local .agentlayer scaffolding", async () => {
    const program = new Command();
    registerInit(program);

    await program.parseAsync(["node", "test", "init"]);

    expect(existsSync(join(tempDir, ".agentlayer", "playbooks", "api-feature.yml"))).toBe(true);
    expect(existsSync(join(tempDir, ".agentlayer", "templates", "spec.md.hbs"))).toBe(true);
    expect(existsSync(join(tempDir, ".agentlayer", "memory", "index.jsonl"))).toBe(true);
    expect(existsSync(join(tempDir, ".agentlayer", "memory", "global", "patterns.md"))).toBe(true);
  });
});
