import { execSync } from "child_process";
import { realpathSync } from "fs";
import { join } from "path";

export interface ProjectPaths {
  projectName: string;
  projectRoot: string;
  agentlayerDir: string;
  playbooksDir: string;
  templatesDir: string;
  memoryDir: string;
  memoryModulesDir: string;
  memoryGlobalDir: string;
  embeddingsDir: string;
  memoryIndexPath: string;
  projectCacheDir: string;
}

function normalizePath(path: string): string {
  const trimmed = path.trim().replace(/\/$/, "") || path;

  try {
    return realpathSync.native(trimmed);
  } catch {
    return trimmed;
  }
}

export function resolveProjectRoot(cwd = process.cwd()): string {
  try {
    const root = execSync("git rev-parse --show-toplevel", {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return normalizePath(root);
  } catch {
    return normalizePath(cwd);
  }
}

export function resolveProjectPaths(cwd = process.cwd()): ProjectPaths {
  const projectRoot = resolveProjectRoot(cwd);
  const projectName = projectRoot.split("/").filter(Boolean).pop() ?? "project";
  const agentlayerDir = join(projectRoot, ".agentlayer");
  const playbooksDir = join(agentlayerDir, "playbooks");
  const templatesDir = join(agentlayerDir, "templates");
  const memoryDir = join(agentlayerDir, "memory");

  return {
    projectName,
    projectRoot,
    agentlayerDir,
    playbooksDir,
    templatesDir,
    memoryDir,
    memoryModulesDir: join(memoryDir, "modules"),
    memoryGlobalDir: join(memoryDir, "global"),
    embeddingsDir: join(memoryDir, "embeddings"),
    memoryIndexPath: join(memoryDir, "index.jsonl"),
    projectCacheDir: join(agentlayerDir, "cache"),
  };
}
