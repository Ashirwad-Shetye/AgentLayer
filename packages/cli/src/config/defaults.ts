import type { AgentLayerConfig } from "@ashirwad-shetye/agentlayer-shared";

export function getDefaultConfig(): AgentLayerConfig {
  return {
    globalEnabled: true,
    modules: {},
    embeddings: {
      provider: "anthropic",
    },
    editor: process.env["EDITOR"] ?? "vim",
    defaultAgent: "codex",
    toggleStates: {},
  };
}
