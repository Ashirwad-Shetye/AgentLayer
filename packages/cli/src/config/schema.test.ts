import { describe, expect, it } from "vitest";
import { AgentLayerConfigSchema } from "./schema.js";

describe("AgentLayerConfigSchema", () => {
  it("loads config without team ownership fields", () => {
    const parsed = AgentLayerConfigSchema.parse({});

    expect(parsed.globalEnabled).toBe(true);
    expect(parsed.modules).toEqual({});
    expect(parsed.defaultAgent).toBe("codex");
    expect(parsed.toggleStates).toEqual({});
    expect(parsed).not.toHaveProperty("teams");
    expect(parsed).not.toHaveProperty("defaultTeam");
  });
});
