import { Command } from "commander";
import { resolveProjectPaths } from "../config/project-paths.js";
import { loadAllMemories, relativeMemoryPath } from "../core/memory/reader.js";
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

  memory
    .command("logs")
    .description("list memory entries with timestamps, titles, and paths")
    .option("--module <path>", "limit to a module")
    .option("--limit <count>", "limit number of rows", "50")
    .action((options: { module?: string; limit: string }) => {
      const paths = resolveProjectPaths();
      const limit = Number.parseInt(options.limit, 10);

      if (Number.isNaN(limit) || limit <= 0) {
        console.error("Limit must be a positive integer.");
        process.exit(1);
      }

      let memories = loadAllMemories(paths.memoryDir);

      if (options.module) {
        memories = memories.filter(
          (memoryEntry) =>
            memoryEntry.frontmatter.module === options.module ||
            memoryEntry.frontmatter.module.startsWith(`${options.module}/`),
        );
      }

      const rows = memories
        .slice()
        .sort(
          (left, right) =>
            new Date(right.frontmatter.date).getTime() -
            new Date(left.frontmatter.date).getTime(),
        )
        .slice(0, limit);

      if (rows.length === 0) {
        console.log("No memory entries found.");
        return;
      }

      for (const memoryEntry of rows) {
        const title = memoryEntry.frontmatter.task || "(untitled)";
        const relativePath = relativeMemoryPath(paths.memoryDir, memoryEntry.filePath);
        console.log(
          [
            memoryEntry.frontmatter.date,
            title,
            `module=${memoryEntry.frontmatter.module}`,
            `developer=${memoryEntry.frontmatter.developer}`,
            relativePath,
          ].join(" | "),
        );
      }
    });
}
