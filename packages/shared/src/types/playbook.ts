export type AgentTarget = "claude-code" | "codex" | "cursor" | "any";

export interface ContextStrategy {
  include?: string[];
  exclude?: string[];
  summarize?: string[];
  maxTokens?: number;
  priorityFiles?: string[];
}

export interface PlaybookStep {
  name: string;
  prompt: string;
  checkpoint?: string;
  checkpointAuto?: boolean;
  timeoutMinutes?: number;
}

export interface Playbook {
  name: string;
  description: string;
  agent: AgentTarget;
  version: string;
  contextStrategy: ContextStrategy;
  steps: PlaybookStep[];
  tags?: string[];
  author?: string;
}
