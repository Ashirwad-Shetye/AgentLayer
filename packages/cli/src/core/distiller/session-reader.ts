import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { homedir } from "os";
import { extname, join } from "path";

interface SessionCandidate {
  agent: "codex" | "claude-code";
  path: string;
  mtimeMs: number;
}

interface SessionEvent {
  payload?: {
    content?: Array<{
      text?: string;
      type?: string;
    }>;
    role?: string;
    type?: string;
  };
  type?: string;
}

function walkFiles(rootPath: string): string[] {
  if (!existsSync(rootPath)) {
    return [];
  }

  const results: string[] = [];

  function walk(dirPath: string): void {
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      results.push(fullPath);
    }
  }

  walk(rootPath);
  return results;
}

function latestFile(candidates: SessionCandidate[]): SessionCandidate | null {
  return candidates.sort((left, right) => right.mtimeMs - left.mtimeMs)[0] ?? null;
}

export function findLatestSessionPath(): { agent: "codex" | "claude-code"; path: string } | null {
  const codexRoots = [
    join(homedir(), ".codex", "sessions"),
    join(homedir(), ".codex", "archived_sessions"),
  ];
  const claudeRoots = [
    join(homedir(), ".claude", "conversations"),
    join(homedir(), ".claude", "projects"),
  ];

  const candidates: SessionCandidate[] = [];

  for (const root of codexRoots) {
    for (const filePath of walkFiles(root)) {
      if (extname(filePath) !== ".jsonl") {
        continue;
      }

      candidates.push({
        agent: "codex",
        path: filePath,
        mtimeMs: statSync(filePath).mtimeMs,
      });
    }
  }

  for (const root of claudeRoots) {
    for (const filePath of walkFiles(root)) {
      if (extname(filePath) !== ".jsonl" && extname(filePath) !== ".json") {
        continue;
      }

      candidates.push({
        agent: "claude-code",
        path: filePath,
        mtimeMs: statSync(filePath).mtimeMs,
      });
    }
  }

  const latest = latestFile(candidates);

  if (!latest) {
    return null;
  }

  return {
    agent: latest.agent,
    path: latest.path,
  };
}

function extractContentText(
  content: Array<{ text?: string; type?: string }> | undefined,
): string | null {
  if (!content) {
    return null;
  }

  const text = content
    .map((item) => item.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || null;
}

export function readCodexSession(path: string): {
  cwd?: string;
  userMessages: string[];
  assistantMessages: string[];
} {
  const lines = readFileSync(path, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const userMessages: string[] = [];
  const assistantMessages: string[] = [];
  let cwd: string | undefined;

  for (const line of lines) {
    let parsed: SessionEvent | null = null;

    try {
      parsed = JSON.parse(line) as SessionEvent;
    } catch {
      continue;
    }

    if (parsed.type === "session_meta") {
      const meta = JSON.parse(line) as {
        payload?: { cwd?: string };
      };
      cwd = meta.payload?.cwd ?? cwd;
      continue;
    }

    if (parsed.type !== "response_item" || parsed.payload?.type !== "message") {
      continue;
    }

    const text = extractContentText(parsed.payload.content);

    if (!text) {
      continue;
    }

    if (parsed.payload.role === "user") {
      userMessages.push(text);
    } else if (parsed.payload.role === "assistant") {
      assistantMessages.push(text);
    }
  }

  return {
    ...(cwd ? { cwd } : {}),
    userMessages,
    assistantMessages,
  };
}
