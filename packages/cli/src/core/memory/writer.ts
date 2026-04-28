import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import Handlebars from "handlebars";
import {
  ensureParentDir,
  sha256Short,
  type MemoryEntry,
  type MemoryFrontmatter,
} from "@ashirwad-shetye/agentlayer-shared";
import type { WriteMemoryOptions } from "./types.js";

function getGitUser(): string {
  try {
    return execSync("git config user.name", { encoding: "utf-8" }).trim();
  } catch {
    return process.env["USER"] ?? "unknown";
  }
}

function getCurrentCommit(): string | undefined {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return undefined;
  }
}

function slugifyTask(task: string): string {
  const slug = task.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug.slice(0, 40) || "untitled";
}

export function buildMemoryFilePath(
  memoryRepo: string,
  moduleName: string,
  date: string,
  task: string,
): string {
  const monthDir = date.slice(0, 7);
  const moduleDir = moduleName.replace(/\//g, "-");
  return join(
    memoryRepo,
    "modules",
    moduleDir,
    monthDir,
    `${date}-${slugifyTask(task)}.md`,
  );
}

export function renderMemoryTemplate(
  templatePath: string,
  data: Record<string, string>,
): string {
  const source = readFileSync(templatePath, "utf-8");
  const template = Handlebars.compile(source);
  return template(data);
}

function buildFrontmatterBlock(frontmatter: MemoryFrontmatter): string[] {
  return [
    "---",
    `date: ${frontmatter.date}`,
    `module: ${frontmatter.module}`,
    `task: ${frontmatter.task}`,
    `developer: ${frontmatter.developer}`,
    `agent: ${frontmatter.agent}`,
    frontmatter.tokensUsed ? `tokensUsed: ${frontmatter.tokensUsed}` : "",
    `tags: [${frontmatter.tags.join(", ")}]`,
    frontmatter.commit ? `commit: ${frontmatter.commit}` : "",
    frontmatter.playbookUsed ? `playbookUsed: ${frontmatter.playbookUsed}` : "",
    "---",
  ].filter(Boolean);
}

function buildMarkdown(frontmatter: MemoryFrontmatter, options: WriteMemoryOptions): string {
  const blocks = [
    ...buildFrontmatterBlock(frontmatter),
    "",
    "## decision",
    options.content.decision,
    "",
    "## reason",
    options.content.reason,
  ];

  if (options.content.rejected) {
    blocks.push("", "## rejected", options.content.rejected);
  }

  if (options.content.tradeoffAccepted) {
    blocks.push("", "## tradeoff accepted", options.content.tradeoffAccepted);
  }

  if (options.content.open) {
    blocks.push("", "## open", options.content.open);
  }

  if (options.content.reusablePattern) {
    blocks.push("", "## reusable pattern", options.content.reusablePattern);
  }

  return blocks.join("\n");
}

function withDefinedProps<T extends object>(value: T): T {
  return value;
}

function appendIndexEntry(
  memoryRepo: string,
  entry: MemoryEntry,
): void {
  const indexPath = join(memoryRepo, "index.jsonl");
  const line = JSON.stringify({
    id: entry.id,
    filePath: entry.filePath.replace(`${memoryRepo}/`, ""),
    date: entry.frontmatter.date,
    module: entry.frontmatter.module,
    developer: entry.frontmatter.developer,
    tags: entry.frontmatter.tags,
  });
  const existing = existsSync(indexPath) ? readFileSync(indexPath, "utf-8") : "";
  writeFileSync(indexPath, `${existing}${line}\n`, "utf-8");
}

export function writeMemoryEntry(
  options: WriteMemoryOptions,
): { filePath: string; entry: MemoryEntry } {
  const date = new Date().toISOString().slice(0, 10);
  const developer = getGitUser();
  const commit = getCurrentCommit();
  const frontmatter: MemoryFrontmatter = withDefinedProps({
    ...options.frontmatter,
    date,
    developer,
    ...(commit ? { commit } : {}),
  });
  const id = sha256Short(`${date}:${frontmatter.module}:${developer}`);
  const filePath = buildMemoryFilePath(
    options.memoryRepo,
    frontmatter.module,
    date,
    frontmatter.task,
  );
  const rawMarkdown = buildMarkdown(frontmatter, options);

  ensureParentDir(filePath);
  writeFileSync(filePath, rawMarkdown, "utf-8");

  const entry: MemoryEntry = withDefinedProps({
    id,
    frontmatter,
    decision: options.content.decision,
    reason: options.content.reason,
    ...(options.content.rejected
      ? { rejected: options.content.rejected }
      : {}),
    ...(options.content.tradeoffAccepted
      ? { tradeoffAccepted: options.content.tradeoffAccepted }
      : {}),
    ...(options.content.open ? { open: options.content.open } : {}),
    ...(options.content.reusablePattern
      ? { reusablePattern: options.content.reusablePattern }
      : {}),
    rawMarkdown,
    filePath,
  });

  appendIndexEntry(options.memoryRepo, entry);

  return { filePath, entry };
}
