import { existsSync, readFileSync, readdirSync } from "fs";
import { extname, join } from "path";
import matter from "gray-matter";
import {
  sha256Short,
  type IndexedMemory,
  type MemoryEntry,
  type MemoryFrontmatter,
} from "@ashirwad-shetye/agentlayer-shared";

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
    const frontmatter = data as MemoryFrontmatter;

    if (!frontmatter.date || !frontmatter.module || !frontmatter.developer) {
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

  if (!existsSync(modulesDir)) {
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
          `${parsed.decision} ${parsed.reason} ${parsed.frontmatter.tags.join(" ")}`,
        ),
        decayScore: computeDecayScore(parsed.frontmatter.date, existsSync(fullPath)),
      });
    }
  }

  walk(modulesDir);

  return memories;
}
