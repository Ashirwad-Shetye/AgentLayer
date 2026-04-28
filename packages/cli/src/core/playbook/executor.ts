import Handlebars from "handlebars";
import { execa } from "execa";
import type { Playbook, PlaybookStep } from "@agentlayer/shared";
import type {
  AgentExecutor,
  ExecutionContext,
  StepResult,
} from "./types.js";

function renderPrompt(template: string, context: ExecutionContext): string {
  const compiled = Handlebars.compile(template);
  return compiled({
    task: context.task,
    specPath: context.specPath,
    cwd: context.workingDir,
    projectName: context.projectName,
    projectRoot: context.projectRoot,
  });
}

const executeClaudeCode: AgentExecutor = async (
  prompt,
  cwd,
  timeoutMinutes,
) => {
  const result = await execa("claude", ["-p", prompt], {
    cwd,
    timeout: timeoutMinutes * 60 * 1000,
  });

  return {
    output: result.stdout,
    tokensUsed: 0,
  };
};

const executeCodex: AgentExecutor = async (prompt, cwd, timeoutMinutes) => {
  const result = await execa("codex", ["--full-auto", "-q", prompt], {
    cwd,
    timeout: timeoutMinutes * 60 * 1000,
  });

  return {
    output: result.stdout,
    tokensUsed: 0,
  };
};

function getAgentExecutor(agent: string): AgentExecutor {
  if (agent === "claude-code") {
    return executeClaudeCode;
  }

  if (agent === "codex" || agent === "cursor" || agent === "any") {
    return executeCodex;
  }

  throw new Error(`Unknown agent: ${agent}`);
}

export async function executeStep(
  step: PlaybookStep,
  context: ExecutionContext,
): Promise<StepResult> {
  const prompt = renderPrompt(step.prompt, context);
  const agent = context.config.defaultAgent;

  try {
    const executor = getAgentExecutor(agent);
    const result = await executor(prompt, context.workingDir, step.timeoutMinutes ?? 30);

    return {
      stepName: step.name,
      success: true,
      output: result.output,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    return {
      stepName: step.name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function executePlaybook(
  playbook: Playbook,
  context: ExecutionContext,
  onStepComplete: (result: StepResult) => void,
): Promise<StepResult[]> {
  const results: StepResult[] = [];

  for (const step of playbook.steps) {
    const result = await executeStep(step, context);
    results.push(result);
    onStepComplete(result);

    if (!result.success) {
      break;
    }
  }

  return results;
}
