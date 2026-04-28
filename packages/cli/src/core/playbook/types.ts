import type { Playbook, PlaybookStep } from "@ashirwad-shetye/agentlayer-shared";
import type { ValidatedConfig } from "../../config/schema.js";

export interface ExecutionContext {
  task: string;
  specPath: string;
  workingDir: string;
  projectName: string;
  projectRoot: string;
  config: ValidatedConfig;
}

export interface StepResult {
  stepName: string;
  success: boolean;
  output?: string;
  error?: string;
  tokensUsed?: number;
}

export interface PlaybookSummary {
  name: string;
  description: string;
  agent: Playbook["agent"];
}

export type AgentExecutor = (
  prompt: string,
  cwd: string,
  timeoutMinutes: number,
) => Promise<{ output: string; tokensUsed: number }>;

export type StepExecutor = (
  step: PlaybookStep,
  context: ExecutionContext,
) => Promise<StepResult>;
