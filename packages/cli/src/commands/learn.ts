import inquirer from "inquirer";
import { Command } from "commander";
import { getTeamConfig, loadConfig } from "../config/loader.js";
import { loadAllMemories } from "../core/memory/reader.js";
import { listPlaybooks } from "../core/playbook/parser.js";

export function registerLearn(program: Command): void {
  program
    .command("learn")
    .description("interactive overview of team playbooks and recent memory")
    .option("--team <name>", "team config name")
    .action(async (options: { team?: string }) => {
      const config = loadConfig();
      const teamName = options.team ?? config.defaultTeam;

      if (!teamName) {
        console.error("No team configured. Run agentlayer init first.");
        process.exit(1);
      }

      const team = getTeamConfig(config, teamName);
      const playbooks = listPlaybooks(team.playbooksRepo);
      const memories = loadAllMemories(team.memoryRepo)
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
