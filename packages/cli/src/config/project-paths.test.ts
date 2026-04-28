import { execSync } from "child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveProjectPaths, resolveProjectRoot } from "./project-paths.js";

describe("project path resolution", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "agentlayer-project-paths-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("prefers the git root when inside a repository", () => {
    execSync("git init", { cwd: tempDir, encoding: "utf-8" });
    const nested = join(tempDir, "apps", "web");
    mkdirSync(nested, { recursive: true });

    expect(resolveProjectRoot(nested)).toBe(realpathSync.native(tempDir));
  });

  it("falls back to the cwd when not in a repository", () => {
    const nested = join(tempDir, "plain", "folder");
    mkdirSync(nested, { recursive: true });

    const paths = resolveProjectPaths(nested);
    const normalizedNested = realpathSync.native(nested);

    expect(paths.projectRoot).toBe(normalizedNested);
    expect(paths.agentlayerDir).toBe(join(normalizedNested, ".agentlayer"));
    expect(paths.playbooksDir).toBe(join(normalizedNested, ".agentlayer", "playbooks"));
  });
});
