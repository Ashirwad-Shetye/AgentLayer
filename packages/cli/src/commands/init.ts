import { execSync } from "child_process";
import { cpSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { loadConfig, saveConfig } from "../config/loader.js";

function getTemplatesRoot(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return join(currentDir, "..", "..", "..", "..", "templates");
}

function copyTemplateRepo(sourceName: string, destination: string): void {
  const source = join(getTemplatesRoot(), sourceName);
  cpSync(source, destination, { recursive: true });
}

function ensureLocalRepoStructure(playbooksPath: string, memoryPath: string): void {
  mkdirSync(join(playbooksPath, "playbooks"), { recursive: true });
  mkdirSync(join(playbooksPath, "templates"), { recursive: true });
  mkdirSync(join(memoryPath, "modules"), { recursive: true });
  mkdirSync(join(memoryPath, "global"), { recursive: true });
  mkdirSync(join(memoryPath, "embeddings"), { recursive: true });

  if (!existsSync(join(memoryPath, "index.jsonl"))) {
    writeFileSync(join(memoryPath, "index.jsonl"), "", "utf-8");
  }
}

function initializeGitRepo(repoPath: string): void {
  if (existsSync(join(repoPath, ".git"))) {
    return;
  }

  execSync(`git init "${repoPath}"`, { encoding: "utf-8" });
}

export function registerInit(program: Command): void {
  program
    .command("init")
    .description("initialize AgentLayer for a team")
    .requiredOption("--team <name>", "team name")
    .option("--playbooks-repo <url>", "git URL for the playbooks repo")
    .option("--memory-repo <url>", "git URL for the memory repo")
    .option("--local", "create local repos instead of cloning")
    .action((options: {
      local?: boolean;
      memoryRepo?: string;
      playbooksRepo?: string;
      team: string;
    }) => {
      const spinner = ora("Initializing AgentLayer...").start();

      try {
        const config = loadConfig();
        const teamRoot = join(homedir(), ".agentlayer", "repos", options.team);
        const playbooksPath = join(teamRoot, "playbooks");
        const memoryPath = join(teamRoot, "memory");

        mkdirSync(teamRoot, { recursive: true });

        if (options.local) {
          mkdirSync(playbooksPath, { recursive: true });
          mkdirSync(memoryPath, { recursive: true });
          initializeGitRepo(playbooksPath);
          initializeGitRepo(memoryPath);
          ensureLocalRepoStructure(playbooksPath, memoryPath);
          copyTemplateRepo("playbooks-repo", playbooksPath);
          copyTemplateRepo("memory-repo", memoryPath);
        } else {
          if (options.playbooksRepo && !existsSync(playbooksPath)) {
            execSync(`git clone "${options.playbooksRepo}" "${playbooksPath}"`, {
              encoding: "utf-8",
            });
          }

          if (options.memoryRepo && !existsSync(memoryPath)) {
            execSync(`git clone "${options.memoryRepo}" "${memoryPath}"`, {
              encoding: "utf-8",
            });
          }
        }

        config.teams[options.team] = {
          name: options.team,
          playbooksRepo: playbooksPath,
          memoryRepo: memoryPath,
          enabled: true,
          memoryAccess: "read-write",
        };

        if (!config.defaultTeam) {
          config.defaultTeam = options.team;
        }

        saveConfig(config);

        spinner.succeed(`Initialized team "${options.team}"`);
        console.log(chalk.dim(`playbooks: ${playbooksPath}`));
        console.log(chalk.dim(`memory:    ${memoryPath}`));
      } catch (error) {
        spinner.fail("Initialization failed");
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
