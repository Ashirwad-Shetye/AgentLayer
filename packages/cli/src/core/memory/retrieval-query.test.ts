import { describe, expect, it } from "vitest";
import { compileRetrievalQuery } from "./retrieval-query.js";

describe("compileRetrievalQuery", () => {
  it("builds stable compiled query text from structured context", () => {
    const compiled = compileRetrievalQuery({
      query: "Why polling?",
      retrieval: {
        question: "Why polling?",
        task: "Update dashboard analytics refresh flow",
        module: "src/dashboard/analytics",
        files: ["src/dashboard/view.tsx", "src/dashboard/api.ts"],
        keywords: ["webhooks", "refresh cadence"],
        phase: "implementation",
        intent: "understand",
      },
    });

    expect(compiled.moduleFilter).toBe("src/dashboard/analytics");
    expect(compiled.searchText).toContain("task Update dashboard analytics refresh flow");
    expect(compiled.searchText).toContain("files src/dashboard/view.tsx src/dashboard/api.ts");
    expect(compiled.embeddingText).toContain("Important terms: webhooks, refresh cadence");
  });

  it("normalizes optional fields and array order into a stable cache key", () => {
    const left = compileRetrievalQuery({
      query: "Why polling?",
      retrieval: {
        question: " Why polling? ",
        module: "src/dashboard",
        files: ["src/a.ts", "src/b.ts"],
        keywords: ["webhooks", "polling"],
      },
    });
    const right = compileRetrievalQuery({
      query: "Why polling?",
      retrieval: {
        question: "Why polling?",
        module: "src/dashboard",
        files: ["src/b.ts", "src/a.ts"],
        keywords: ["polling", "webhooks"],
      },
    });

    expect(left.normalizedKey).toBe(right.normalizedKey);
  });

  it("falls back to the legacy raw query shape", () => {
    const compiled = compileRetrievalQuery({
      query: "Why did auth token rotation change?",
      module: "src/auth",
      intent: "debug",
    });

    expect(compiled.moduleFilter).toBe("src/auth");
    expect(compiled.searchText).toContain("Why did auth token rotation change?");
    expect(compiled.searchText).toContain("intent debug");
  });
});
