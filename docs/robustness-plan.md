# Robustness Hardening Plan

This plan tracks the remaining work to move AgentLayer from solid beta to production-grade team tooling.

## Phase 1: CI Release Gates

Goal: every PR proves the repo can build, typecheck, test, and package.

Steps:

- Add a GitHub Actions workflow for `pnpm install`, `pnpm build`, `pnpm typecheck`, and `pnpm test`.
- Add packed tarball checks for shared, CLI, and MCP packages.
- Fail CI if published tarballs include test files or miss required runtime files such as CLI templates.

Acceptance check:

- A clean PR run proves build, typecheck, tests, and package contents.

## Phase 2: Packed Install Smoke Tests

Goal: verify the npm install experience from tarballs, not only workspace source.

Steps:

- Create a temp repo in CI.
- Install packed `@ashirwad-shetye/agentlayer-cli`.
- Run `agentlayer --help`, `agentlayer init`, `agentlayer log --auto`, `agentlayer memory search`, and `agentlayer memory logs`.
- Install packed `@ashirwad-shetye/agentlayer-mcp` and verify the server boots.

Acceptance check:

- A fresh temp repo can execute the real user workflow using only packed packages.

## Phase 3: MCP Protocol Integration Tests

Goal: test MCP behavior through the real stdio protocol, not only helper functions.

Steps:

- Start the built MCP server in a temp project with initialized `.agentlayer/`.
- Call `tools/list` and verify `agentlayer_query` and `agentlayer_log` schemas.
- Call `agentlayer_log` with rich fields and verify the memory file.
- Call `agentlayer_query` with prompt-shaped context and verify relevant memory is returned.
- Verify invalid arguments return MCP errors without crashing the process.

Acceptance check:

- MCP tests cover both valid and invalid tool calls end to end.

## Phase 4: `.agentlayer/` Layout Versioning

Goal: make future layout changes safe for existing repos.

Steps:

- Add `.agentlayer/manifest.json` or `.agentlayer/version.json`.
- Record layout version, initialized package version, and enabled modules.
- Add a lightweight `agentlayer doctor` command that reports missing directories, malformed memory entries, and outdated layout versions.
- Keep `agentlayer init` idempotent and non-destructive.

Acceptance check:

- Existing repos can be checked and upgraded without overwriting user-owned files.

## Phase 5: Git Commit Semantics

Goal: make memory persistence predictable around commits and dirty worktrees.

Steps:

- Document that CLI `log` and `digest` attempt best-effort commits, while MCP logging writes files but does not commit.
- Add a `--no-commit` option to CLI logging commands for teams that want manual staging.
- Improve commit failure messages with actionable reasons.
- Add tests for repos with no commits, dirty worktrees, missing git user config, and ignored `.agentlayer` files.

Acceptance check:

- Users can clearly tell whether memory was only written, staged, or committed.

## Phase 6: Search Quality Evaluation

Goal: prevent prompt-shaped retrieval regressions.

Steps:

- Add fixture memories for auth, dashboard analytics, webhooks, billing, and refactors.
- Add ranking tests for short questions versus structured context.
- Verify rejected alternatives, tradeoffs, open follow-ups, and reusable patterns are searchable.
- Add module-boundary tests for sibling prefixes such as `src/auth` and `src/authentication`.

Acceptance check:

- Retrieval tests prove richer context improves or preserves ranking across representative cases.

## Phase 7: Documentation Consistency Checks

Goal: keep docs aligned with real commands and MCP inputs.

Steps:

- Add a docs check for stale package names, `agentkit`, `better-sqlite3`, `--team`, and external repo references.
- Add a link checker for root README and docs.
- Keep CLI examples runnable in temp repos where possible.

Acceptance check:

- Docs checks fail when examples drift from the actual command surface.

## Build Order

1. CI release gates.
2. Packed install smoke tests.
3. MCP protocol integration tests.
4. Layout versioning and `agentlayer doctor`.
5. Git commit semantics.
6. Search quality evaluation.
7. Documentation consistency checks.
