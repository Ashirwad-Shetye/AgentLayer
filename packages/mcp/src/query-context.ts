import {
  compileRetrievalQuery,
  type RetrievalPhase,
  type RetrievalQuery,
} from "@ashirwad-shetye/agentlayer-cli/core/memory/search";

export type QueryIntent = "understand" | "extend" | "debug" | "review";

export interface QueryArguments {
  query: string;
  module?: string;
  intent?: QueryIntent;
  task?: string;
  files?: string[];
  error?: string;
  keywords?: string[];
  agent?: string;
  phase?: RetrievalPhase;
}

export function buildRetrievalQuery(args: QueryArguments): RetrievalQuery {
  return {
    question: args.query,
    ...(args.task ? { task: args.task } : {}),
    ...(args.module ? { module: args.module } : {}),
    ...(args.intent ? { intent: args.intent } : {}),
    ...(args.files ? { files: args.files } : {}),
    ...(args.error ? { error: args.error } : {}),
    ...(args.keywords ? { keywords: args.keywords } : {}),
    ...(args.agent ? { agent: args.agent } : {}),
    ...(args.phase ? { phase: args.phase } : {}),
  };
}

export function buildQueryCacheKey(args: QueryArguments): string {
  return compileRetrievalQuery({
    query: args.query,
    ...(args.module ? { module: args.module } : {}),
    ...(args.intent ? { intent: args.intent } : {}),
    retrieval: buildRetrievalQuery(args),
  }).normalizedKey;
}
