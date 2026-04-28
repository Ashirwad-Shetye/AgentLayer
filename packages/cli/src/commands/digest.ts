import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import chalk from "chalk";
import { Command } from "commander";
import Handlebars from "handlebars";
import { getTeamConfig, loadConfig } from "../config/loader.js";
import { summarizeLatestSession } from "../core/distiller/extractor.js";
import { writeMemoryEntry } from "../core/memory/writer.js";

function buildDigestTemplate(
  templatePath: string | undefined,
  data: {
    module: string;
    task: string;
    agent: string;
    decision: string;
    reason: string;
    open?: string;
  },
): string {
  if (templatePath && existsSync(templatePath)) {
    const source = readFileSync(templatePath, "utf-8");
    const template = Handlebars.compile(source);
    const rendered = template({
      module: data.module,
      task: data.task,
      agent: data.agent,
    });

    return [
      rendered.trimEnd(),
      "",
      data.decision ? `## decision\n${data.decision}` : "",
      data.reason ? `\n## reason\n${data.reason}` : "",
      data.open ? `\n## open\n${data.open}` : "",
      "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return `---
module: ${data.module}
task: ${data.task}
agent: ${data.agent}
tags: [digest]
---

## decision
${data.decision}

## reason
${data.reason}

## open
${data.open ?? ""}
`;
}

function extractSection(markdown: string, heading: string): string | undefined {
  const match = markdown.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |$)`, "m"));
  return match?.[1]?.trim() || undefined;
}

function extractFrontmatterLine(markdown: string, key: string, fallback: string): string {
  const match = markdown.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? fallback;
}

export function registerDigest(program: Command): void {
  program
    .command("digest")
    .description("distill a recent agent session into team memory")
    .option("--team <name>", "team config name")
    .option("--module <path>", "module path override")
    .option("--session <path>", "explicit session file path")
    .option("--auto", "non-interactive mode for scripted usage")
    .action(
      (options: {
        auto?: boolean;
        module?: string;
        session?: string;
        team?: string;
      }) => {
        const config = loadConfig();
        const teamName = options.team ?? config.defaultTeam;

        if (!teamName) {
          console.error("No team configured. Run agentlayer init first.");
          process.exit(1);
        }

        const team = getTeamConfig(config, teamName);
        const summary = summarizeLatestSession(options.session);

        if (!summary) {
          console.error("No supported session logs were found for digest.");
          process.exit(1);
        }

        const moduleName = options.module ?? "global";
        const tempPath = join(tmpdir(), `agentlayer-digest-${Date.now()}.md`);
        const memoryTemplatePath = join(team.playbooksRepo, "templates", "memory-entry.md.hbs");
        const initial = buildDigestTemplate(memoryTemplatePath, {
          module: moduleName,
          task: summary.task,
          agent: summary.agent,
          decision: summary.decision,
          reason: `${summary.reason}\n\nSource session: ${summary.path}`,
          ...(summary.open ? { open: summary.open } : {}),
        });

        writeFileSync(tempPath, initial, "utf-8");

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

        const task = extractFrontmatterLine(edited, "task", summary.task);
        const agent = extractFrontmatterLine(edited, "agent", summary.agent);
        const moduleFromFile = extractFrontmatterLine(edited, "module", moduleName);
        const tagsLine = extractFrontmatterLine(edited, "tags", "[digest]");
        const tags = tagsLine
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);

        const decision = extractSection(edited, "decision") ?? "";
        const reason = extractSection(edited, "reason") ?? "";
        const rejected = extractSection(edited, "rejected");
        const tradeoffAccepted = extractSection(edited, "tradeoff accepted");
        const open = extractSection(edited, "open");
        const reusablePattern = extractSection(edited, "reusable pattern");

        const { filePath } = writeMemoryEntry({
          memoryRepo: team.memoryRepo,
          frontmatter: {
            module: moduleFromFile,
            task,
            agent:
              agent === "claude-code" || agent === "codex" || agent === "cursor"
                ? agent
                : "other",
            tags: tags.length > 0 ? tags : ["digest"],
          },
          content: {
            decision,
            reason,
            ...(rejected ? { rejected } : {}),
            ...(tradeoffAccepted ? { tradeoffAccepted } : {}),
            ...(open ? { open } : {}),
            ...(reusablePattern ? { reusablePattern } : {}),
          },
        });

        try {
          execSync(`git -C "${team.memoryRepo}" add -A`, { encoding: "utf-8" });
          execSync(`git -C "${team.memoryRepo}" commit -m "digest: ${task}"`, {
            encoding: "utf-8",
          });
        } catch {
          console.log(chalk.yellow("Digest memory was written, but git commit was skipped."));
        }

        console.log(chalk.green(`Digested session: ${summary.path}`));
        console.log(chalk.green(`Logged memory: ${filePath}`));
      },
    );
}
