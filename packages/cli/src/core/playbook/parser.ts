import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { load as loadYaml } from "js-yaml";
import { z } from "zod";
import type { Playbook } from "@ashirwad-shetye/agentlayer-shared";
import type { PlaybookSummary } from "./types.js";

const PlaybookSchema = z.object({
  name: z.string(),
  description: z.string(),
  agent: z.enum(["claude-code", "codex", "cursor", "any"]).default("codex"),
  version: z.string().default("1.0.0"),
  contextStrategy: z
    .object({
      include: z.array(z.string()).default([]),
      exclude: z
        .array(z.string())
        .default(["node_modules/**", "dist/**", ".git/**"]),
      summarize: z.array(z.string()).default([]),
      maxTokens: z.number().default(80_000),
      priorityFiles: z.array(z.string()).default([]),
    })
    .default({}),
  steps: z.array(
    z.object({
      name: z.string(),
      prompt: z.string(),
      checkpoint: z.string().optional(),
      checkpointAuto: z.boolean().default(false),
      timeoutMinutes: z.number().default(30),
    }),
  ),
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),
});

function playbookCandidates(playbooksRepo: string, name: string): string[] {
  return [
    join(playbooksRepo, "playbooks", `${name}.yml`),
    join(playbooksRepo, "playbooks", `${name}.yaml`),
    join(playbooksRepo, `${name}.yml`),
    join(playbooksRepo, `${name}.yaml`),
  ];
}

export function loadPlaybook(playbooksRepo: string, name: string): Playbook {
  for (const filePath of playbookCandidates(playbooksRepo, name)) {
    if (!existsSync(filePath)) {
      continue;
    }

    const raw = readFileSync(filePath, "utf-8");
    const parsed = loadYaml(raw);
    return PlaybookSchema.parse(parsed) as Playbook;
  }

  throw new Error(`Playbook "${name}" not found in ${join(playbooksRepo, "playbooks")}`);
}

export function listPlaybooks(playbooksRepo: string): PlaybookSummary[] {
  const playbooksDir = join(playbooksRepo, "playbooks");

  if (!existsSync(playbooksDir)) {
    return [];
  }

  return readdirSync(playbooksDir)
    .filter((entry) => entry.endsWith(".yml") || entry.endsWith(".yaml"))
    .map((entry) => entry.replace(/\.ya?ml$/, ""))
    .map((name) => {
      try {
        const playbook = loadPlaybook(playbooksRepo, name);
        return {
          name: playbook.name,
          description: playbook.description,
          agent: playbook.agent,
        };
      } catch {
        return null;
      }
    })
    .filter((playbook): playbook is PlaybookSummary => playbook !== null);
}
