import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { getTeamConfig, loadConfig } from "../config/loader.js";
import { searchMemory } from "../core/memory/search.js";
import { executePlaybook } from "../core/playbook/executor.js";
import { loadPlaybook } from "../core/playbook/parser.js";

export function registerRun(program: Command): void {
  program
    .command("run <playbook>")
    .description("execute a playbook with an AI agent")
    .requiredOption("--task <description>", "task description")
    .option("--team <name>", "team config name")
    .option("--dry-run", "show context without invoking an agent")
    .option("--agent <name>", "override default agent")
    .action(
      async (
        playbookName: string,
        options: {
          agent?: string;
          dryRun?: boolean;
          task: string;
          team?: string;
        },
      ) => {
        const config = loadConfig();
        const teamName = options.team ?? config.defaultTeam;

        if (!teamName) {
          console.error("No team configured. Run agentlayer init first.");
          process.exit(1);
        }

        const team = getTeamConfig(config, teamName);
        const playbook = loadPlaybook(team.playbooksRepo, playbookName);
        const spinner = ora("Loading memory context...").start();
        const memoryContext = await searchMemory({
          memoryRepo: team.memoryRepo,
          query: options.task,
          intent: "extend",
          ...(process.env["ANTHROPIC_API_KEY"]
            ? { apiKey: process.env["ANTHROPIC_API_KEY"] }
            : {}),
        });
        spinner.stop();

        if (options.dryRun) {
          console.log(chalk.bold("Memory context"));
          console.log(memoryContext);
          console.log("");
          console.log(chalk.bold("Steps"));
          for (const step of playbook.steps) {
            console.log(`- ${step.name}`);
          }
          return;
        }

        const executionConfig =
          options.agent !== undefined
            ? { ...config, defaultAgent: options.agent }
            : config;

        const results = await executePlaybook(
          playbook,
          {
            task: options.task,
            specPath: "spec.md",
            workingDir: process.cwd(),
            config: executionConfig,
            teamName,
          },
          (result) => {
            if (result.success) {
              console.log(chalk.green(`OK ${result.stepName}`));
              return;
            }

            console.log(chalk.red(`FAIL ${result.stepName}: ${result.error ?? "unknown error"}`));
          },
        );

        if (results.some((result) => !result.success)) {
          process.exit(1);
        }
      },
    );
}
