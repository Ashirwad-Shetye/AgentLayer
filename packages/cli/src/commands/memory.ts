import { Command } from "commander";
import { getTeamConfig, loadConfig } from "../config/loader.js";
import { loadAllMemories } from "../core/memory/reader.js";
import { searchMemory } from "../core/memory/search.js";

export function registerMemory(program: Command): void {
  const memory = program.command("memory").description("query team memory");

  memory
    .command("search <query>")
    .option("--team <name>", "team config name")
    .option("--module <path>", "limit to a module")
    .option("--intent <intent>", "understand | extend | debug | review")
    .action(
      async (
        query: string,
        options: {
          intent?: "understand" | "extend" | "debug" | "review";
          module?: string;
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
        const result = await searchMemory({
          memoryRepo: team.memoryRepo,
          query,
          ...(options.module ? { module: options.module } : {}),
          ...(options.intent ? { intent: options.intent } : {}),
          ...(process.env["ANTHROPIC_API_KEY"]
            ? { apiKey: process.env["ANTHROPIC_API_KEY"] }
            : {}),
        });

        console.log(result);
      },
    );

  memory
    .command("list")
    .option("--team <name>", "team config name")
    .action((options: { team?: string }) => {
      const config = loadConfig();
      const teamName = options.team ?? config.defaultTeam;

      if (!teamName) {
        console.error("No team configured. Run agentlayer init first.");
        process.exit(1);
      }

      const team = getTeamConfig(config, teamName);
      const memories = loadAllMemories(team.memoryRepo);
      const counts = new Map<string, number>();

      for (const memoryEntry of memories) {
        counts.set(
          memoryEntry.frontmatter.module,
          (counts.get(memoryEntry.frontmatter.module) ?? 0) + 1,
        );
      }

      for (const [moduleName, count] of [...counts.entries()].sort()) {
        console.log(`${moduleName}: ${count}`);
      }
    });
}
