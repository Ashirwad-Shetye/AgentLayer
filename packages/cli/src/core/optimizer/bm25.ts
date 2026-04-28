import type { IndexedMemory } from "@ashirwad-shetye/agentlayer-shared";

interface BM25Params {
  k1: number;
  b: number;
}

interface CorpusStats {
  avgFieldLength: number;
  docFrequencies: Map<string, number>;
  totalDocs: number;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function buildCorpusStats(memories: IndexedMemory[]): CorpusStats {
  const docFrequencies = new Map<string, number>();
  let totalLength = 0;

  for (const memory of memories) {
    totalLength += memory.bm25Tokens.length;
    const uniqueTokens = new Set(memory.bm25Tokens);

    for (const token of uniqueTokens) {
      docFrequencies.set(token, (docFrequencies.get(token) ?? 0) + 1);
    }
  }

  return {
    avgFieldLength: totalLength / Math.max(memories.length, 1),
    docFrequencies,
    totalDocs: memories.length,
  };
}

function scoreDocument(
  queryTokens: string[],
  docTokens: string[],
  stats: CorpusStats,
  params: BM25Params = { k1: 1.5, b: 0.75 },
): number {
  if (docTokens.length === 0) {
    return 0;
  }

  const frequencies = new Map<string, number>();

  for (const token of docTokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  let score = 0;

  for (const term of queryTokens) {
    const termFrequency = frequencies.get(term) ?? 0;

    if (termFrequency === 0) {
      continue;
    }

    const docFrequency = stats.docFrequencies.get(term) ?? 0;
    const idf = Math.log(
      (stats.totalDocs - docFrequency + 0.5) / (docFrequency + 0.5) + 1,
    );
    const normalizedTf =
      (termFrequency * (params.k1 + 1)) /
      (termFrequency +
        params.k1 *
          (1 - params.b + params.b * (docTokens.length / stats.avgFieldLength)));

    score += idf * normalizedTf;
  }

  return score;
}

export function bm25Filter(
  query: string,
  memories: IndexedMemory[],
  topN = 20,
): IndexedMemory[] {
  if (memories.length === 0) {
    return [];
  }

  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return memories.slice(0, topN);
  }

  const stats = buildCorpusStats(memories);

  return memories
    .map((memory) => ({
      memory,
      score: scoreDocument(queryTokens, memory.bm25Tokens, stats) * memory.decayScore,
    }))
    .filter((result) => result.score > 0.01)
    .sort((left, right) => right.score - left.score)
    .slice(0, topN)
    .map((result) => result.memory);
}
