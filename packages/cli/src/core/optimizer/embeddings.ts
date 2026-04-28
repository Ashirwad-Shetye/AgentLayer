import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { IndexedMemory } from "@agentlayer/shared";

const queryEmbeddingCache = new Map<string, Float32Array>();

function cosineSimilarity(left: Float32Array, right: Float32Array): number {
  const maxLength = Math.max(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue ** 2;
    rightMagnitude += rightValue ** 2;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude) + 1e-8);
}

function embeddingPathForModule(memoryRepo: string, moduleName: string): string {
  return join(memoryRepo, "embeddings", `${moduleName.replace(/\//g, "-")}.bin`);
}

export function loadEmbeddingFromRepo(
  memoryRepo: string,
  moduleName: string,
): Float32Array | null {
  const filePath = embeddingPathForModule(memoryRepo, moduleName);

  if (!existsSync(filePath)) {
    return null;
  }

  const buffer = readFileSync(filePath);
  return new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    Math.floor(buffer.byteLength / Float32Array.BYTES_PER_ELEMENT),
  );
}

async function requestAnthropicEmbedding(
  query: string,
  apiKey: string,
): Promise<Float32Array> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system:
        "Return only a JSON array of floats representing the embedding of the user text. No prose.",
      messages: [{ role: "user", content: query }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic embedding request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };
  const text = data.content?.[0]?.text ?? "[]";
  const parsed = JSON.parse(text) as number[];
  return new Float32Array(parsed);
}

async function requestLocalEmbedding(
  query: string,
  modelName: string,
): Promise<Float32Array> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      prompt: query,
    }),
  });

  if (!response.ok) {
    throw new Error(`Local embedding request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { embedding?: number[] };
  return new Float32Array(data.embedding ?? []);
}

export async function getQueryEmbedding(
  query: string,
  options: {
    provider?: "anthropic" | "local";
    apiKey?: string;
    localModel?: string;
  },
): Promise<Float32Array> {
  const provider = options.provider ?? "anthropic";
  const hash = createHash("sha256").update(`${provider}:${query}`).digest("hex");
  const cached = queryEmbeddingCache.get(hash);

  if (cached) {
    return cached;
  }

  const embedding =
    provider === "local"
      ? await requestLocalEmbedding(query, options.localModel ?? "nomic-embed-text")
      : await requestAnthropicEmbedding(query, options.apiKey ?? "");

  queryEmbeddingCache.set(hash, embedding);
  return embedding;
}

export function attachRepoEmbeddings(
  memoryRepo: string,
  memories: IndexedMemory[],
): IndexedMemory[] {
  return memories.map((memory) => {
    const embedding = loadEmbeddingFromRepo(memoryRepo, memory.frontmatter.module);

    if (!embedding) {
      return memory;
    }

    return {
      ...memory,
      embedding,
    };
  });
}

export function semanticRerank(
  queryEmbedding: Float32Array,
  candidates: IndexedMemory[],
  topN = 5,
): IndexedMemory[] {
  return candidates
    .map((memory) => ({
      memory,
      score: memory.embedding
        ? cosineSimilarity(queryEmbedding, memory.embedding) * memory.decayScore
        : 0,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topN)
    .map((result) => result.memory);
}
