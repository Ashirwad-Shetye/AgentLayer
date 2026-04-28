import type { MemoryEntry } from "@agentlayer/shared";

export interface WriteMemoryOptions {
  memoryRepo: string;
  frontmatter: Omit<MemoryEntry["frontmatter"], "date" | "developer" | "commit">;
  content: {
    decision: string;
    reason: string;
    rejected?: string;
    tradeoffAccepted?: string;
    open?: string;
    reusablePattern?: string;
  };
}
