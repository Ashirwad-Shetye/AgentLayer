export type MemoryIntent = "understand" | "extend" | "debug" | "review";

export type MemoryEntryType =
  | "decision"
  | "pattern"
  | "rejected"
  | "open_question"
  | "gotcha";

export interface MemoryFrontmatter {
  date: string;
  module: string;
  task: string;
  developer: string;
  agent: "claude-code" | "codex" | "cursor" | "other";
  tokensUsed?: number;
  tags: string[];
  commit?: string;
  playbookUsed?: string;
}

export interface MemoryEntry {
  id: string;
  frontmatter: MemoryFrontmatter;
  decision: string;
  reason: string;
  rejected?: string;
  tradeoffAccepted?: string;
  open?: string;
  reusablePattern?: string;
  rawMarkdown: string;
  filePath: string;
}

export interface IndexedMemory extends MemoryEntry {
  embedding?: Float32Array;
  bm25Tokens: string[];
  decayScore: number;
}

export interface MemorySearchResult {
  memory: IndexedMemory;
  score: number;
  matchType: "bm25" | "semantic" | "hybrid";
}

export interface ModuleIndex {
  module: string;
  entries: IndexedMemory[];
  lastBuilt: string;
}
