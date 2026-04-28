import { Command } from "commander";
import { resolveProjectPaths } from "../config/project-paths.js";
import { loadAllMemories } from "../core/memory/reader.js";

export function registerSync(program: Command): void {
  program
    .command("sync")
    .description("reload project-local memory from .agentlayer/memory")
    .action(() => {
      const paths = resolveProjectPaths();
      const memories = loadAllMemories(paths.memoryDir);

      console.log(`Reloaded ${memories.length} memory entries from ${paths.memoryDir}.`);
    });
}
