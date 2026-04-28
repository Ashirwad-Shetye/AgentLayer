export interface EmbeddingProviderConfig {
  provider: "anthropic" | "local";
  apiKey?: string;
  localModel?: string;
}
