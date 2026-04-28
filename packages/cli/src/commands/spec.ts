import { spawnSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Command } from "commander";
import Handlebars from "handlebars";
import { getTeamConfig, loadConfig } from "../config/loader.js";

const DEFAULT_SPEC_TEMPLATE = `# spec: {{task}}

## what we're building

## input / output contract

## data model changes

## test plan

## dependencies and constraints
`;

function resolveTemplatePath(teamTemplatePath?: string): string | null {
  if (teamTemplatePath && existsSync(teamTemplatePath)) {
    return teamTemplatePath;
  }

  const localPath = join(process.cwd(), "templates", "spec.md.hbs");
  return existsSync(localPath) ? localPath : null;
}

export function registerSpec(program: Command): void {
  program
    .command("spec <task>")
    .description("create spec.md in the current directory")
    .option("--team <name>", "team config name")
    .action((task: string, options: { team?: string }) => {
      const config = loadConfig();
      const teamName = options.team ?? config.defaultTeam;
      const teamTemplatePath = teamName
        ? join(getTeamConfig(config, teamName).playbooksRepo, "templates", "spec.md.hbs")
        : undefined;
      const templatePath = resolveTemplatePath(teamTemplatePath);
      const source = templatePath ? readFileSync(templatePath, "utf-8") : DEFAULT_SPEC_TEMPLATE;
      const template = Handlebars.compile(source);
      const output = template({
        task,
        date: new Date().toISOString().slice(0, 10),
        developer: process.env["USER"] ?? "unknown",
        module: ".",
      });
      const specPath = join(process.cwd(), "spec.md");

      writeFileSync(specPath, output, "utf-8");

      const editor = config.editor ?? process.env["EDITOR"] ?? "vim";
      spawnSync(editor, [specPath], { stdio: "inherit" });
    });
}
