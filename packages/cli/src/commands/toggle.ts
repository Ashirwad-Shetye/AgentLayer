import { basename } from "path";
import { Command } from "commander";
import { loadConfig, saveConfig } from "../config/loader.js";
import { resolveProjectPaths } from "../config/project-paths.js";

export function registerToggle(program: Command): void {
  program
    .command("toggle <state> [scope]")
    .description("toggle AgentLayer on or off for a scope")
    .action((state: string, scope = "global") => {
      if (state !== "on" && state !== "off") {
        console.error('State must be "on" or "off".');
        process.exit(1);
      }

      const resolvedScope =
        scope === "project" ? `project:${resolveProjectPaths().projectRoot}` : scope;
      const config = loadConfig();
      config.toggleStates[resolvedScope] = state === "on";
      saveConfig(config);
      const current = config.toggleStates[resolvedScope] ?? null;
      const label = resolvedScope.startsWith("project:")
        ? `project:${basename(resolveProjectPaths().projectRoot)}`
        : resolvedScope;
      console.log(`${label}: ${current ? "on" : "off"}`);
    });
}
