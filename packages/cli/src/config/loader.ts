import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import TOML from "@iarna/toml";
import { getDefaultConfig } from "./defaults.js";
import {
  AgentLayerConfigSchema,
  type ValidatedConfig,
} from "./schema.js";

export const CONFIG_DIR = join(homedir(), ".agentlayer");
export const CONFIG_PATH = join(CONFIG_DIR, "config.toml");
export const DB_PATH = join(CONFIG_DIR, "index.db");

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): ValidatedConfig {
  ensureConfigDir();

  if (!existsSync(CONFIG_PATH)) {
    return AgentLayerConfigSchema.parse(getDefaultConfig());
  }

  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const parsed = TOML.parse(raw);

  return AgentLayerConfigSchema.parse(parsed);
}

export function saveConfig(config: ValidatedConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_PATH, TOML.stringify(config as TOML.JsonMap), "utf-8");
}

export function getTeamConfig(
  config: ValidatedConfig,
  teamName: string,
): ValidatedConfig["teams"][string] {
  const team = config.teams[teamName];

  if (!team) {
    throw new Error(
      `Team "${teamName}" not found in config. Run agentlayer init --team ${teamName}`,
    );
  }

  return team;
}
