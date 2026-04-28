import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import TOML from "@iarna/toml";
import { getDefaultConfig } from "./defaults.js";
import {
  AgentLayerConfigSchema,
  type ValidatedConfig,
} from "./schema.js";

export function getConfigDir(): string {
  return join(homedir(), ".agentlayer");
}

export function getConfigPath(): string {
  return join(getConfigDir(), "config.toml");
}

export function ensureConfigDir(): void {
  const configDir = getConfigDir();

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

export function loadConfig(): ValidatedConfig {
  ensureConfigDir();
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return AgentLayerConfigSchema.parse(getDefaultConfig());
  }

  const raw = readFileSync(configPath, "utf-8");
  const parsed = TOML.parse(raw);

  return AgentLayerConfigSchema.parse(parsed);
}

export function saveConfig(config: ValidatedConfig): void {
  ensureConfigDir();
  writeFileSync(getConfigPath(), TOML.stringify(config as TOML.JsonMap), "utf-8");
}
