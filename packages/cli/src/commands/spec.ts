import { spawnSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Command } from "commander";
import Handlebars from "handlebars";
import { loadConfig } from "../config/loader.js";
import { resolveProjectPaths } from "../config/project-paths.js";

const DEFAULT_SPEC_TEMPLATE = `# spec: {{task}}

## what we're building

## input / output contract

## data model changes

## test plan

## dependencies and constraints
`;

function resolveTemplatePath(templatePath: string): string | null {
  return existsSync(templatePath) ? templatePath : null;
}

export function registerSpec(program: Command): void {
  program
    .command("spec <task>")
    .description("create spec.md in the current directory")
    .action((task: string) => {
      const config = loadConfig();
      const paths = resolveProjectPaths();
      const templatePath = resolveTemplatePath(join(paths.templatesDir, "spec.md.hbs"));
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
