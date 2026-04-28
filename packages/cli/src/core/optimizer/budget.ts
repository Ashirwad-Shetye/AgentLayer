import {
  estimateTokens,
  truncateToTokenBudget,
  type IndexedMemory,
  type MemoryIntent,
} from "@agentlayer/shared";

const INTENT_BUDGETS: Record<MemoryIntent, number> = {
  understand: 800,
  extend: 1200,
  debug: 600,
  review: 400,
};

function formatFullMemory(memory: IndexedMemory): string {
  return [
    `[${memory.frontmatter.date}] ${memory.frontmatter.developer} - ${memory.frontmatter.module}`,
    `DECISION: ${memory.decision}`,
    memory.reason ? `REASON: ${memory.reason}` : "",
    memory.rejected ? `REJECTED: ${memory.rejected}` : "",
    memory.tradeoffAccepted ? `TRADEOFF: ${memory.tradeoffAccepted}` : "",
    memory.open ? `OPEN: ${memory.open}` : "",
    memory.reusablePattern ? `PATTERN: ${memory.reusablePattern}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatSummary(memory: IndexedMemory): string {
  const summary = memory.decision.slice(0, 80).trim();
  return `[${memory.frontmatter.date}] ${memory.frontmatter.module}: ${summary}${summary.length === 80 ? "..." : ""}`;
}

export function applyTokenBudget(
  memories: IndexedMemory[],
  intent: MemoryIntent,
): string {
  const budget = INTENT_BUDGETS[intent];
  const header =
    `AGENTLAYER TEAM MEMORY (intent: ${intent}, budget: ${budget} tokens)\n` +
    `${"-".repeat(50)}\n`;
  let body = "";
  let usedTokens = estimateTokens(header);

  for (const memory of memories) {
    const full = formatFullMemory(memory);
    const fullTokens = estimateTokens(full);

    if (usedTokens + fullTokens <= budget) {
      body += `${full}\n\n`;
      usedTokens += fullTokens;
      continue;
    }

    const summary = formatSummary(memory);
    const summaryTokens = estimateTokens(summary);

    if (usedTokens + summaryTokens <= budget) {
      body += `${summary}\n`;
      usedTokens += summaryTokens;
    }
  }

  if (!body) {
    return `${header}No relevant team memory found for this query.`;
  }

  return truncateToTokenBudget(`${header}${body.trimEnd()}`, budget);
}
