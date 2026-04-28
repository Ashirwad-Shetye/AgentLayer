export type MemoryDepth = "full" | "summary" | "none";

export interface TeamConfig {
  name: string;
  playbooksRepo: string;
  memoryRepo: string;
  enabled: boolean;
  memoryAccess: "read-only" | "read-write";
}

export interface ModuleConfig {
  path: string;
  memoryDepth: MemoryDepth;
  watchForHook: boolean;
}

export interface EmbeddingsConfig {
  provider: "anthropic" | "local";
  localModel?: string;
  apiKey?: string;
}

export interface AgentLayerConfig {
  globalEnabled: boolean;
  defaultTeam?: string;
  teams: Record<string, TeamConfig>;
  modules: Record<string, ModuleConfig>;
  embeddings: EmbeddingsConfig;
  editor: string;
  defaultAgent: string;
}
