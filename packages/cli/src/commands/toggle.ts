import { basename } from "path";
import { Command } from "commander";
import { resolveProjectPaths } from "../config/project-paths.js";
import { getDb } from "../db/client.js";
import { getToggleState, setToggleState } from "../db/queries.js";

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
      const db = getDb();
      setToggleState(db, resolvedScope, state === "on");
      const current = getToggleState(db, resolvedScope);
      const label = resolvedScope.startsWith("project:")
        ? `project:${basename(resolveProjectPaths().projectRoot)}`
        : resolvedScope;
      console.log(`${label}: ${current ? "on" : "off"}`);
    });
}
