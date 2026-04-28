import inquirer from "inquirer";
import { Command } from "commander";
import { resolveProjectPaths } from "../config/project-paths.js";
import { loadAllMemories } from "../core/memory/reader.js";
import { listPlaybooks } from "../core/playbook/parser.js";

export function registerLearn(program: Command): void {
  program
    .command("learn")
    .description("interactive overview of project playbooks and recent memory")
    .action(async () => {
      const paths = resolveProjectPaths();
      const playbooks = listPlaybooks(paths.playbooksDir);
      const memories = loadAllMemories(paths.memoryDir)
        .sort((left, right) => right.frontmatter.date.localeCompare(left.frontmatter.date))
        .slice(0, 5);

      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "playbook",
          message: "Choose a playbook to inspect",
          choices: playbooks.map((playbook) => ({
            name: `${playbook.name} - ${playbook.description}`,
            value: playbook.name,
          })),
        },
      ]);

      console.log(`Selected playbook: ${answer.playbook}`);
      console.log("");
      console.log("Recent memory");
      for (const memory of memories) {
        console.log(`- [${memory.frontmatter.date}] ${memory.frontmatter.module}: ${memory.decision}`);
      }
    });
}
