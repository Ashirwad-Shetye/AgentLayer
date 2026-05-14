import type { MemoryIntent } from "@ashirwad-shetye/agentlayer-shared";

export type RetrievalPhase =
  | "planning"
  | "implementation"
  | "debugging"
  | "review";

export interface RetrievalQuery {
  question: string;
  task?: string;
  module?: string;
  intent?: MemoryIntent;
  files?: string[];
  error?: string;
  keywords?: string[];
  agent?: string;
  phase?: RetrievalPhase;
}

export interface CompiledRetrievalQuery {
  searchText: string;
  embeddingText: string;
  moduleFilter?: string;
  normalizedKey: string;
}

interface CompileOptions {
  query: string;
  module?: string;
  intent?: MemoryIntent;
  retrieval?: RetrievalQuery;
}

function normalizeText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeList(values: string[] | undefined): string[] {
  if (!values) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const candidate = normalizeText(value);

    if (!candidate) {
      continue;
    }

    const key = candidate.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(candidate);
  }

  return normalized;
}

function asRetrievalQuery(options: CompileOptions): RetrievalQuery {
  const retrieval = options.retrieval;
  const question = normalizeText(retrieval?.question) ?? normalizeText(options.query) ?? "";
  const task = normalizeText(retrieval?.task);
  const moduleName = normalizeText(retrieval?.module) ?? normalizeText(options.module);
  const intent = retrieval?.intent ?? options.intent;
  const files = normalizeList(retrieval?.files);
  const error = normalizeText(retrieval?.error);
  const keywords = normalizeList(retrieval?.keywords);
  const agent = normalizeText(retrieval?.agent);
  const phase = retrieval?.phase;
  const normalized: RetrievalQuery = { question };

  if (task) {
    normalized.task = task;
  }

  if (moduleName) {
    normalized.module = moduleName;
  }

  if (intent) {
    normalized.intent = intent;
  }

  if (files.length > 0) {
    normalized.files = files;
  }

  if (error) {
    normalized.error = error;
  }

  if (keywords.length > 0) {
    normalized.keywords = keywords;
  }

  if (agent) {
    normalized.agent = agent;
  }

  if (phase) {
    normalized.phase = phase;
  }

  return normalized;
}

function buildSearchText(retrieval: RetrievalQuery): string {
  return [
    retrieval.question,
    retrieval.task ? `task ${retrieval.task}` : "",
    retrieval.module ? `module ${retrieval.module}` : "",
    retrieval.files && retrieval.files.length > 0
      ? `files ${retrieval.files.join(" ")}`
      : "",
    retrieval.error ? `error ${retrieval.error}` : "",
    retrieval.keywords && retrieval.keywords.length > 0
      ? `keywords ${retrieval.keywords.join(" ")}`
      : "",
    retrieval.agent ? `agent ${retrieval.agent}` : "",
    retrieval.phase ? `phase ${retrieval.phase}` : "",
    retrieval.intent ? `intent ${retrieval.intent}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildEmbeddingText(retrieval: RetrievalQuery): string {
  return [
    `Question: ${retrieval.question}`,
    retrieval.task ? `Task: ${retrieval.task}` : "",
    retrieval.module ? `Module: ${retrieval.module}` : "",
    retrieval.files && retrieval.files.length > 0
      ? `Relevant files: ${retrieval.files.join(", ")}`
      : "",
    retrieval.error ? `Current error: ${retrieval.error}` : "",
    retrieval.keywords && retrieval.keywords.length > 0
      ? `Important terms: ${retrieval.keywords.join(", ")}`
      : "",
    retrieval.agent ? `Agent: ${retrieval.agent}` : "",
    retrieval.phase ? `Work phase: ${retrieval.phase}` : "",
    retrieval.intent ? `Intent: ${retrieval.intent}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildNormalizedKey(retrieval: RetrievalQuery): string {
  const files = retrieval.files ? [...retrieval.files].sort() : [];
  const keywords = retrieval.keywords ? [...retrieval.keywords].sort() : [];

  return JSON.stringify({
    question: retrieval.question,
    ...(retrieval.task ? { task: retrieval.task } : {}),
    ...(retrieval.module ? { module: retrieval.module } : {}),
    ...(retrieval.intent ? { intent: retrieval.intent } : {}),
    ...(files.length > 0 ? { files } : {}),
    ...(retrieval.error ? { error: retrieval.error } : {}),
    ...(keywords.length > 0 ? { keywords } : {}),
    ...(retrieval.agent ? { agent: retrieval.agent } : {}),
    ...(retrieval.phase ? { phase: retrieval.phase } : {}),
  });
}

export function compileRetrievalQuery(
  options: CompileOptions,
): CompiledRetrievalQuery {
  const retrieval = asRetrievalQuery(options);

  return {
    searchText: buildSearchText(retrieval),
    embeddingText: buildEmbeddingText(retrieval),
    ...(retrieval.module ? { moduleFilter: retrieval.module } : {}),
    normalizedKey: buildNormalizedKey(retrieval),
  };
}
