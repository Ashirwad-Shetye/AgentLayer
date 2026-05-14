import { describe, expect, it } from "vitest";
import { buildQueryCacheKey, buildRetrievalQuery } from "./query-context.js";

describe("query context", () => {
  it("builds legacy-compatible retrieval payloads", () => {
    const retrieval = buildRetrievalQuery({
      query: "Why did auth token rotation change?",
      module: "src/auth",
      intent: "debug",
    });

    expect(retrieval).toEqual({
      question: "Why did auth token rotation change?",
      module: "src/auth",
      intent: "debug",
    });
  });

  it("keeps structured query context in the retrieval payload", () => {
    const retrieval = buildRetrievalQuery({
      query: "Why polling instead of webhooks?",
      task: "Update dashboard analytics refresh flow",
      module: "src/dashboard",
      files: ["src/dashboard/view.tsx", "src/dashboard/api.ts"],
      error: "Webhook delivery drifted by several minutes.",
      keywords: ["analytics", "refresh cadence"],
      phase: "implementation",
      agent: "codex",
    });

    expect(retrieval.files).toEqual(["src/dashboard/view.tsx", "src/dashboard/api.ts"]);
    expect(retrieval.error).toContain("drifted");
    expect(retrieval.phase).toBe("implementation");
  });

  it("changes cache keys when structured context changes", () => {
    const left = buildQueryCacheKey({
      query: "Why polling?",
      module: "src/dashboard",
      task: "Update dashboard analytics refresh flow",
      files: ["src/dashboard/view.tsx"],
    });
    const right = buildQueryCacheKey({
      query: "Why polling?",
      module: "src/dashboard",
      task: "Debug webhook retries",
      files: ["src/dashboard/webhooks.ts"],
    });

    expect(left).not.toBe(right);
  });
});
