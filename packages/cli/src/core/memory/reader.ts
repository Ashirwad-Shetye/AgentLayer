import { existsSync, readFileSync, readdirSync } from "fs";
import { extname, join, relative } from "path";
import matter from "gray-matter";
import {
  sha256Short,
  type IndexedMemory,
  type MemoryEntry,
  type MemoryFrontmatter,
} from "@ashirwad-shetye/agentlayer-shared";

function normalizeFrontmatter(data: Record<string, unknown>): MemoryFrontmatter | null {
  const dateValue = data["date"];
  const date =
    dateValue instanceof Date
      ? dateValue.toISOString().slice(0, 10)
      : typeof dateValue === "string"
        ? dateValue
        : undefined;
  const moduleName = data["module"];
  const task = data["task"];
  const developer = data["developer"];
  const agent = data["agent"];
  const tags = data["tags"];

  if (
    !date ||
    typeof moduleName !== "string" ||
    typeof task !== "string" ||
    typeof developer !== "string" ||
    !(
      agent === "claude-code" ||
      agent === "codex" ||
      agent === "cursor" ||
      agent === "other"
    )
  ) {
    return null;
  }

  return {
    date,
    module: moduleName,
    task,
    developer,
    agent,
    tags: Array.isArray(tags)
      ? tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    ...(typeof data["tokensUsed"] === "number"
      ? { tokensUsed: data["tokensUsed"] }
      : {}),
    ...(typeof data["commit"] === "string" ? { commit: data["commit"] } : {}),
    ...(typeof data["playbookUsed"] === "string"
      ? { playbookUsed: data["playbookUsed"] }
      : {}),
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function getSection(content: string, heading: string): string | undefined {
  const pattern = new RegExp(
    `^## ${heading}\\n([\\s\\S]*?)(?=^## |$)`,
    "m",
  );
  const match = content.match(pattern);
  return match?.[1]?.trim();
}

export function computeDecayScore(date: string, fileExists: boolean): number {
  if (!fileExists) {
    return 0.1;
  }

  const ageMs = Date.now() - new Date(date).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recency = Math.exp(-ageDays / 260);

  return Math.max(0.1, recency);
}

export function parseMemoryFile(filePath: string): MemoryEntry | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const frontmatter = normalizeFrontmatter(data);

    if (!frontmatter) {
      return null;
    }

    const rejected = getSection(content, "rejected");
    const tradeoffAccepted = getSection(content, "tradeoff accepted");
    const open = getSection(content, "open");
    const reusablePattern = getSection(content, "reusable pattern");

    return {
      id: sha256Short(`${frontmatter.date}:${frontmatter.module}:${frontmatter.developer}`),
      frontmatter,
      decision: getSection(content, "decision") ?? "",
      reason: getSection(content, "reason") ?? "",
      rawMarkdown: raw,
      filePath,
      ...(rejected !== undefined ? { rejected } : {}),
      ...(tradeoffAccepted !== undefined ? { tradeoffAccepted } : {}),
      ...(open !== undefined ? { open } : {}),
      ...(reusablePattern !== undefined ? { reusablePattern } : {}),
    };
  } catch {
    return null;
  }
}

export function loadAllMemories(memoryRepo: string): IndexedMemory[] {
  const modulesDir = join(memoryRepo, "modules");
  const globalDir = join(memoryRepo, "global");

  if (!existsSync(modulesDir) && !existsSync(globalDir)) {
    return [];
  }

  const memories: IndexedMemory[] = [];

  function walk(dirPath: string): void {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (extname(entry.name) !== ".md") {
        continue;
      }

      const parsed = parseMemoryFile(fullPath);

      if (!parsed) {
        continue;
      }

      memories.push({
        ...parsed,
        bm25Tokens: tokenize(
          [
            parsed.frontmatter.module,
            parsed.frontmatter.task,
            parsed.frontmatter.developer,
            parsed.frontmatter.agent,
            parsed.frontmatter.tags.join(" "),
            parsed.decision,
            parsed.reason,
            parsed.rejected ?? "",
            parsed.tradeoffAccepted ?? "",
            parsed.open ?? "",
            parsed.reusablePattern ?? "",
          ].join(" "),
        ),
        decayScore: computeDecayScore(parsed.frontmatter.date, existsSync(fullPath)),
      });
    }
  }

  if (existsSync(globalDir)) {
    walk(globalDir);
  }

  if (existsSync(modulesDir)) {
    walk(modulesDir);
  }

  return memories;
}

export function relativeMemoryPath(memoryRepo: string, filePath: string): string {
  return relative(memoryRepo, filePath) || filePath;
}
