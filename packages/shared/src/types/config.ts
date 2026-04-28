export type MemoryDepth = "full" | "summary" | "none";

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
  modules: Record<string, ModuleConfig>;
  embeddings: EmbeddingsConfig;
  editor: string;
  defaultAgent: string;
}
