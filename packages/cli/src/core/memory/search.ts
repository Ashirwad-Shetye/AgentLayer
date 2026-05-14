import type { MemoryIntent } from "@ashirwad-shetye/agentlayer-shared";
import { loadAllMemories } from "./reader.js";
import { applyTokenBudget } from "../optimizer/budget.js";
import { bm25Filter } from "../optimizer/bm25.js";
import {
  compileRetrievalQuery,
  type RetrievalQuery,
} from "./retrieval-query.js";
export {
  compileRetrievalQuery,
  type RetrievalPhase,
  type RetrievalQuery,
} from "./retrieval-query.js";
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
  retrieval?: RetrievalQuery;
  apiKey?: string;
  embeddingProvider?: "anthropic" | "local";
  localModel?: string;
}

function moduleMatches(memoryModule: string, moduleFilter: string): boolean {
  return (
    memoryModule === moduleFilter ||
    memoryModule.startsWith(`${moduleFilter}/`)
  );
}

export async function searchMemory(options: SearchOptions): Promise<string> {
  const intent = options.intent ?? "understand";
  const compiledQuery = compileRetrievalQuery({
    query: options.query,
    ...(options.module ? { module: options.module } : {}),
    intent,
    ...(options.retrieval ? { retrieval: options.retrieval } : {}),
  });
  let memories = loadAllMemories(options.memoryRepo);

  if (compiledQuery.moduleFilter) {
    const moduleFilter = compiledQuery.moduleFilter;
    memories = memories.filter(
      (memory) => moduleMatches(memory.frontmatter.module, moduleFilter),
    );
  }

  if (memories.length === 0) {
    return "No relevant project memory found for this query.";
  }

  memories = attachRepoEmbeddings(options.memoryRepo, memories);

  const candidates = bm25Filter(compiledQuery.searchText, memories, 20);

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
      const queryEmbedding = await getQueryEmbedding(compiledQuery.embeddingText, {
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
