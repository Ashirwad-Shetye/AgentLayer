import type { RetrievalPhase } from "@ashirwad-shetye/agentlayer-cli/core/memory/search";
import type { QueryArguments, QueryIntent } from "./query-context.js";

const QUERY_INTENTS: QueryIntent[] = ["understand", "extend", "debug", "review"];
const RETRIEVAL_PHASES: RetrievalPhase[] = [
  "planning",
  "implementation",
  "debugging",
  "review",
];

export interface LogArguments {
  decision: string;
  reason: string;
  module?: string;
  rejected?: string;
  tradeoffAccepted?: string;
  open?: string;
  reusablePattern?: string;
  tags?: string[];
}

export interface ParseResult<T> {
  value?: T;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const field = value[key];

  if (field === undefined) {
    return undefined;
  }

  return typeof field === "string" && field.trim().length > 0
    ? field
    : undefined;
}

function stringListField(
  value: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const field = value[key];

  if (field === undefined) {
    return undefined;
  }

  if (!Array.isArray(field)) {
    return undefined;
  }

  const strings = field.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );

  return strings.length > 0 ? strings : undefined;
}

function enumField<T extends string>(
  value: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const field = value[key];

  if (field === undefined) {
    return undefined;
  }

  return typeof field === "string" && allowed.includes(field as T)
    ? field as T
    : undefined;
}

export function parseQueryArguments(args: unknown): ParseResult<QueryArguments> {
  if (!isRecord(args)) {
    return { error: "agentlayer_query requires an object argument." };
  }

  const query = stringField(args, "query");

  if (!query) {
    return { error: "agentlayer_query requires a non-empty query string." };
  }

  const moduleName = stringField(args, "module");
  const intent = enumField(args, "intent", QUERY_INTENTS);
  const task = stringField(args, "task");
  const files = stringListField(args, "files");
  const error = stringField(args, "error");
  const keywords = stringListField(args, "keywords");
  const agent = stringField(args, "agent");
  const phase = enumField(args, "phase", RETRIEVAL_PHASES);

  return {
    value: {
      query,
      ...(moduleName ? { module: moduleName } : {}),
      ...(intent ? { intent } : {}),
      ...(task ? { task } : {}),
      ...(files ? { files } : {}),
      ...(error ? { error } : {}),
      ...(keywords ? { keywords } : {}),
      ...(agent ? { agent } : {}),
      ...(phase ? { phase } : {}),
    },
  };
}

export function parseLogArguments(args: unknown): ParseResult<LogArguments> {
  if (!isRecord(args)) {
    return { error: "agentlayer_log requires an object argument." };
  }

  const decision = stringField(args, "decision");
  const reason = stringField(args, "reason");

  if (!decision) {
    return { error: "agentlayer_log requires a non-empty decision string." };
  }

  if (!reason) {
    return { error: "agentlayer_log requires a non-empty reason string." };
  }

  const moduleName = stringField(args, "module");
  const rejected = stringField(args, "rejected");
  const tradeoffAccepted = stringField(args, "tradeoffAccepted");
  const open = stringField(args, "open");
  const reusablePattern = stringField(args, "reusablePattern");
  const tags = stringListField(args, "tags");

  return {
    value: {
      decision,
      reason,
      ...(moduleName ? { module: moduleName } : {}),
      ...(rejected ? { rejected } : {}),
      ...(tradeoffAccepted ? { tradeoffAccepted } : {}),
      ...(open ? { open } : {}),
      ...(reusablePattern ? { reusablePattern } : {}),
      ...(tags ? { tags } : {}),
    },
  };
}
