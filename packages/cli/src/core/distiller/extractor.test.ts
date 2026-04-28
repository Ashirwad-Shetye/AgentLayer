import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { summarizeLatestSession } from "./extractor.js";

describe("summarizeLatestSession", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "agentlayer-distiller-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("extracts a task and decision from a Codex session file", () => {
    const sessionPath = join(tempDir, "session.jsonl");
    writeFileSync(
      sessionPath,
      [
        JSON.stringify({
          type: "session_meta",
          payload: {
            cwd: "/tmp/project",
          },
        }),
        JSON.stringify({
          type: "response_item",
          payload: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "Add audit logging to billing updates" }],
          },
        }),
        JSON.stringify({
          type: "response_item",
          payload: {
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "Implemented audit logging in the billing update flow and added tests." }],
          },
        }),
      ].join("\n"),
      "utf-8",
    );

    const summary = summarizeLatestSession(sessionPath);

    expect(summary).not.toBeNull();
    expect(summary?.task).toContain("Add audit logging");
    expect(summary?.decision).toContain("Implemented audit logging");
    expect(summary?.cwd).toBe("/tmp/project");
  });
});
