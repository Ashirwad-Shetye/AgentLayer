import { Command } from "commander";
import { registerDigest } from "./commands/digest.js";
import { registerInit } from "./commands/init.js";
import { registerLearn } from "./commands/learn.js";
import { registerLog } from "./commands/log.js";
import { registerMemory } from "./commands/memory.js";
import { registerRun } from "./commands/run.js";
import { registerSpec } from "./commands/spec.js";
import { registerSync } from "./commands/sync.js";
import { registerToggle } from "./commands/toggle.js";

const program = new Command();

program
  .name("agentlayer")
  .description("git-native institutional memory for AI-assisted development teams")
  .version("0.1.0");

registerInit(program);
registerRun(program);
registerSpec(program);
registerLog(program);
registerDigest(program);
registerSync(program);
registerToggle(program);
registerMemory(program);
registerLearn(program);

program.parse();
