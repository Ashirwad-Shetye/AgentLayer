import { basename } from "path";
import type { SessionSummary } from "./types.js";
import { findLatestSessionPath, readCodexSession } from "./session-reader.js";

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, limit: number): string {
  const normalized = normalizeWhitespace(text);
  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 3).trimEnd()}...`;
}

function firstMeaningful(messages: string[]): string | null {
  for (const message of messages) {
    const normalized = normalizeWhitespace(message);
    if (normalized.length > 20) {
      return normalized;
    }
  }

  return null;
}

function lastMeaningful(messages: string[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const normalized = normalizeWhitespace(messages[index] ?? "");
    if (normalized.length > 20) {
      return normalized;
    }
  }

  return null;
}

function sessionTask(
  userMessages: string[],
  fallbackPath: string,
): string {
  return truncate(
    firstMeaningful(userMessages) ?? `Digest session ${basename(fallbackPath)}`,
    80,
  );
}

export function summarizeLatestSession(
  explicitPath?: string,
): SessionSummary | null {
  if (explicitPath) {
    const parsed = readCodexSession(explicitPath);
    const task = sessionTask(parsed.userMessages, explicitPath);
    const latestAssistant = lastMeaningful(parsed.assistantMessages);

    return {
      path: explicitPath,
      agent: "codex",
      ...(parsed.cwd ? { cwd: parsed.cwd } : {}),
      task,
      decision: truncate(
        latestAssistant ?? "Review the session transcript and capture the key implementation decision.",
        1200,
      ),
      reason: truncate(
        `Derived from session activity in ${parsed.cwd ?? "unknown workspace"}. Original request: ${task}`,
        600,
      ),
    };
  }

  const discovered = findLatestSessionPath();

  if (!discovered) {
    return null;
  }

  if (discovered.agent === "codex") {
    const parsed = readCodexSession(discovered.path);
    const task = sessionTask(parsed.userMessages, discovered.path);
    const latestAssistant = lastMeaningful(parsed.assistantMessages);

    return {
      path: discovered.path,
      agent: "codex",
      ...(parsed.cwd ? { cwd: parsed.cwd } : {}),
      task,
      decision: truncate(
        latestAssistant ?? "Review the session transcript and capture the key implementation decision.",
        1200,
      ),
      reason: truncate(
        `Derived from session activity in ${parsed.cwd ?? "unknown workspace"}. Original request: ${task}`,
        600,
      ),
    };
  }

  return {
    path: discovered.path,
    agent: "claude-code",
    task: `Digest session ${basename(discovered.path)}`,
    decision: "Review the Claude session transcript and capture the key implementation decision.",
    reason: "Automatic Claude session extraction is not implemented yet; manual review is required.",
    open: "Add Claude transcript parsing support.",
  };
}
