import type { MemoryIntent } from "@agentlayer/shared";
import { loadAllMemories } from "./reader.js";
import { applyTokenBudget } from "../optimizer/budget.js";
import { bm25Filter } from "../optimizer/bm25.js";
import {
  attachRepoEmbeddings,
  getQueryEmbedding,
  semanticRerank,
} from "../optimizer/embeddings.js";

export interface SearchOptions {
  memoryRepo: string;
  query: string;
  module?: string;
  intent?: MemoryIntent;
  apiKey?: string;
  embeddingProvider?: "anthropic" | "local";
  localModel?: string;
}

export async function searchMemory(options: SearchOptions): Promise<string> {
  const intent = options.intent ?? "understand";
  let memories = loadAllMemories(options.memoryRepo);

  if (options.module) {
    const moduleFilter = options.module;
    memories = memories.filter(
      (memory) =>
        memory.frontmatter.module === moduleFilter ||
        memory.frontmatter.module.startsWith(moduleFilter),
    );
  }

  if (memories.length === 0) {
    return "No relevant project memory found for this query.";
  }

  memories = attachRepoEmbeddings(options.memoryRepo, memories);

  const candidates = bm25Filter(options.query, memories, 20);

  if (candidates.length === 0) {
    return "No relevant project memory found for this query.";
  }

  let reranked = candidates.slice(0, 5);
  const hasEmbeddings = candidates.some((candidate) => candidate.embedding !== undefined);

  if (
    hasEmbeddings &&
    ((options.embeddingProvider === "local") || options.apiKey)
  ) {
    try {
      const queryEmbedding = await getQueryEmbedding(options.query, {
        provider: options.embeddingProvider ?? "anthropic",
        ...(options.apiKey ? { apiKey: options.apiKey } : {}),
        ...(options.localModel ? { localModel: options.localModel } : {}),
      });
      reranked = semanticRerank(queryEmbedding, candidates, 5);
    } catch {
      reranked = candidates.slice(0, 5);
    }
  }

  return applyTokenBudget(reranked, intent);
}
