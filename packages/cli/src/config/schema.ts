import { z } from "zod";

const ModuleConfigSchema = z.object({
  path: z.string(),
  memoryDepth: z.enum(["full", "summary", "none"]).default("full"),
  watchForHook: z.boolean().default(true),
});

const EmbeddingsConfigSchema = z.object({
  provider: z.enum(["anthropic", "local"]).default("anthropic"),
  localModel: z.string().optional(),
  apiKey: z.string().optional(),
});

export const AgentLayerConfigSchema = z.object({
  globalEnabled: z.boolean().default(true),
  modules: z.record(ModuleConfigSchema).default({}),
  embeddings: EmbeddingsConfigSchema.default({ provider: "anthropic" }),
  editor: z.string().default(process.env["EDITOR"] ?? "vim"),
  defaultAgent: z.string().default("codex"),
  toggleStates: z.record(z.boolean()).default({}),
});

export type ValidatedConfig = z.infer<typeof AgentLayerConfigSchema>;
