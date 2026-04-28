import { execSync } from "child_process";
import { Command } from "commander";
import { getTeamConfig, loadConfig } from "../config/loader.js";
import { loadAllMemories } from "../core/memory/reader.js";

function tryPull(repoPath: string): void {
  try {
    execSync(`git -C "${repoPath}" pull`, { encoding: "utf-8" });
  } catch {
    // Keep sync usable for locally initialized repos without remotes.
  }
}

export function registerSync(program: Command): void {
  program
    .command("sync")
    .description("pull team repos and rebuild memory view from disk")
    .option("--team <name>", "team config name")
    .action((options: { team?: string }) => {
      const config = loadConfig();
      const teamName = options.team ?? config.defaultTeam;

      if (!teamName) {
        console.error("No team configured. Run agentlayer init first.");
        process.exit(1);
      }

      const team = getTeamConfig(config, teamName);
      tryPull(team.playbooksRepo);
      tryPull(team.memoryRepo);
      const memories = loadAllMemories(team.memoryRepo);

      console.log(`Synced ${teamName}. Loaded ${memories.length} memory entries.`);
    });
}
