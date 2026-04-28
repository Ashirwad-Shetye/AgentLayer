import { cpSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { resolveProjectPaths } from "../config/project-paths.js";

function getTemplatesRoot(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return join(currentDir, "..", "..", "templates");
}

function copyTemplateDir(sourceRelativePath: string, destination: string): void {
  const source = join(getTemplatesRoot(), sourceRelativePath);
  cpSync(source, destination, { recursive: true });
}

function ensureProjectAgentlayerStructure(paths: ReturnType<typeof resolveProjectPaths>): void {
  mkdirSync(paths.playbooksDir, { recursive: true });
  mkdirSync(paths.templatesDir, { recursive: true });
  mkdirSync(paths.memoryModulesDir, { recursive: true });
  mkdirSync(paths.memoryGlobalDir, { recursive: true });
  mkdirSync(paths.embeddingsDir, { recursive: true });
  mkdirSync(paths.projectCacheDir, { recursive: true });

  if (!existsSync(paths.memoryIndexPath)) {
    writeFileSync(paths.memoryIndexPath, "", "utf-8");
  }
}

export function registerInit(program: Command): void {
  program
    .command("init")
    .description("initialize project-local AgentLayer data in the current repo")
    .action(() => {
      const spinner = ora("Initializing AgentLayer...").start();

      try {
        const paths = resolveProjectPaths();
        ensureProjectAgentlayerStructure(paths);
        copyTemplateDir("playbooks-repo/playbooks", paths.playbooksDir);
        copyTemplateDir("playbooks-repo/templates", paths.templatesDir);
        copyTemplateDir("memory-repo/global", paths.memoryGlobalDir);
        copyTemplateDir("memory-repo/modules", paths.memoryModulesDir);
        copyTemplateDir("memory-repo/embeddings", paths.embeddingsDir);

        if (!existsSync(paths.memoryIndexPath)) {
          writeFileSync(paths.memoryIndexPath, "", "utf-8");
        }

        spinner.succeed(`Initialized AgentLayer in ${paths.projectRoot}`);
        console.log(chalk.dim(`playbooks: ${paths.playbooksDir}`));
        console.log(chalk.dim(`templates: ${paths.templatesDir}`));
        console.log(chalk.dim(`memory:    ${paths.memoryDir}`));
      } catch (error) {
        spinner.fail("Initialization failed");
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
