import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { loadConfig } from "../config/loader.js";
import { resolveProjectPaths } from "../config/project-paths.js";
import { searchMemory } from "../core/memory/search.js";
import { executePlaybook } from "../core/playbook/executor.js";
import { loadPlaybook } from "../core/playbook/parser.js";

export function registerRun(program: Command): void {
  program
    .command("run <playbook>")
    .description("execute a playbook with an AI agent")
    .requiredOption("--task <description>", "task description")
    .option("--dry-run", "show context without invoking an agent")
    .option("--agent <name>", "override default agent")
    .action(
      async (
        playbookName: string,
        options: {
          agent?: string;
          dryRun?: boolean;
          task: string;
        },
      ) => {
        const config = loadConfig();
        const paths = resolveProjectPaths();
        const playbook = loadPlaybook(paths.playbooksDir, playbookName);
        const spinner = ora("Loading memory context...").start();
        const memoryContext = await searchMemory({
          memoryRepo: paths.memoryDir,
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
            projectName: paths.projectName,
            projectRoot: paths.projectRoot,
            config: executionConfig,
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
