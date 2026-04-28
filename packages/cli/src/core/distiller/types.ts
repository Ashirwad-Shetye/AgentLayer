export interface SessionSummary {
  path: string;
  agent: "codex" | "claude-code";
  cwd?: string;
  task: string;
  decision: string;
  reason: string;
  rejected?: string;
  open?: string;
}
