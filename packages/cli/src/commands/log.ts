import { spawnSync } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import chalk from "chalk";
import { Command } from "commander";
import Handlebars from "handlebars";
import { loadConfig } from "../config/loader.js";
import { resolveProjectPaths } from "../config/project-paths.js";
import { commitProjectMemoryFiles } from "../core/memory/git.js";
import { writeMemoryEntry } from "../core/memory/writer.js";

const TEMPLATE = `---
module: global
task: untitled
agent: codex
tags: []
---

## decision

## reason

## rejected

## tradeoff accepted

## open

## reusable pattern
`;

function extractSection(markdown: string, heading: string): string | undefined {
  const match = markdown.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |$)`, "m"));
  return match?.[1]?.trim() || undefined;
}

function extractFrontmatterLine(markdown: string, key: string, fallback: string): string {
  const match = markdown.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? fallback;
}

function buildLogTemplate(memoryTemplatePath?: string): string {
  if (memoryTemplatePath && existsSync(memoryTemplatePath)) {
    const source = readFileSync(memoryTemplatePath, "utf-8");
    const template = Handlebars.compile(source);
    return template({
      module: "global",
      task: "untitled",
      agent: "codex",
    });
  }

  return TEMPLATE;
}

export function registerLog(program: Command): void {
  program
    .command("log")
    .description("record a decision to project memory")
    .option("--module <path>", "module path override")
    .option("--auto", "non-interactive mode for scripted usage")
    .action((options: { auto?: boolean; module?: string }) => {
      const config = loadConfig();
      const paths = resolveProjectPaths();
      const tempPath = join(tmpdir(), `agentlayer-log-${Date.now()}.md`);
      const memoryTemplatePath = join(paths.templatesDir, "memory-entry.md.hbs");

      writeFileSync(tempPath, buildLogTemplate(memoryTemplatePath), "utf-8");

      if (!options.auto) {
        const editor = config.editor ?? process.env["EDITOR"] ?? "vim";
        const result = spawnSync(editor, [tempPath], { stdio: "inherit" });

        if (result.status !== 0) {
          unlinkSync(tempPath);
          process.exit(result.status ?? 1);
        }
      }

      const edited = readFileSync(tempPath, "utf-8");
      unlinkSync(tempPath);

      const moduleName = options.module ?? extractFrontmatterLine(edited, "module", "global");
      const task = extractFrontmatterLine(edited, "task", "untitled");
      const agent = extractFrontmatterLine(edited, "agent", "codex");
      const tagsLine = extractFrontmatterLine(edited, "tags", "[]");
      const tags = tagsLine.replace(/^\[|\]$/g, "").split(",").map((tag) => tag.trim()).filter(Boolean);
      const rejected = extractSection(edited, "rejected");
      const tradeoffAccepted = extractSection(edited, "tradeoff accepted");
      const open = extractSection(edited, "open");
      const reusablePattern = extractSection(edited, "reusable pattern");

      const { filePath } = writeMemoryEntry({
        memoryRepo: paths.memoryDir,
        frontmatter: {
          module: moduleName,
          task,
          agent:
            agent === "claude-code" || agent === "codex" || agent === "cursor"
              ? agent
              : "other",
          tags,
        },
        content: {
          decision: extractSection(edited, "decision") ?? "",
          reason: extractSection(edited, "reason") ?? "",
          ...(rejected !== undefined ? { rejected } : {}),
          ...(tradeoffAccepted !== undefined ? { tradeoffAccepted } : {}),
          ...(open !== undefined ? { open } : {}),
          ...(reusablePattern !== undefined ? { reusablePattern } : {}),
        },
      });

      if (
        !commitProjectMemoryFiles(
          paths.projectRoot,
          [filePath, paths.memoryIndexPath],
          `log: ${task} (${moduleName})`,
        )
      ) {
        console.log(chalk.yellow("Memory was written, but git commit was skipped."));
      }

      console.log(chalk.green(`Logged memory: ${filePath}`));
    });
}
