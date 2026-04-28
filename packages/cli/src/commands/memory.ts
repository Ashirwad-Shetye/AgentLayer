import { Command } from "commander";
import { resolveProjectPaths } from "../config/project-paths.js";
import { loadAllMemories } from "../core/memory/reader.js";
import { searchMemory } from "../core/memory/search.js";

export function registerMemory(program: Command): void {
  const memory = program.command("memory").description("query project memory");

  memory
    .command("search <query>")
    .option("--module <path>", "limit to a module")
    .option("--intent <intent>", "understand | extend | debug | review")
    .action(
      async (
        query: string,
        options: {
          intent?: "understand" | "extend" | "debug" | "review";
          module?: string;
        },
      ) => {
        const paths = resolveProjectPaths();
        const result = await searchMemory({
          memoryRepo: paths.memoryDir,
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

  memory.command("list").action(() => {
    const paths = resolveProjectPaths();
    const memories = loadAllMemories(paths.memoryDir);
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
