import { Command } from "commander";
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

      const db = getDb();
      setToggleState(db, scope, state === "on");
      const current = getToggleState(db, scope);
      console.log(`${scope}: ${current ? "on" : "off"}`);
    });
}
