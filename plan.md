# agentlayer Implementation Plan

This is the concise execution plan for building `agentlayer`. The original detailed source plan remains available as reference material.

Each phase must produce working, testable output before the next phase starts.

## Phase 0 - Monorepo Scaffold

**Goal:** Create the package structure and build tooling without business logic.

**Steps:**
- Create the pnpm workspace root with `package.json`, `pnpm-workspace.yaml`, `turbo.json`, and `tsconfig.base.json`.
- Create `packages/cli`, `packages/mcp`, and `packages/shared` with package manifests, TypeScript configs, source entrypoints, and placeholder exports.
- Add CLI and MCP bin shims.
- Create the planned root folders: `templates`, `docs`, and `.github/workflows`.
- Add `README.md` stubs to each package/folder that needs an immediate purpose note.

**Acceptance check:** `pnpm install` succeeds and `pnpm build` completes with placeholder source files.

## Phase 1 - Shared Types And Utilities

**Goal:** Define the shared contract used by CLI and MCP packages.

**Steps:**
- Add memory types for frontmatter, entries, indexed entries, search results, and module indexes.
- Add playbook types for agent targets, context strategy, steps, and playbooks.
- Add config types for teams, modules, embeddings, and the full AgentLayer config.
- Add shared utilities for approximate token counting, budget truncation, and short SHA-256 hashes.
- Export public shared types and utilities from `packages/shared/src/index.ts`.

**Acceptance check:** `packages/shared` builds cleanly and exports only intentional public contracts.

## Phase 2 - Config And SQLite Foundation

**Goal:** Build the configuration and local index foundation all later features depend on.

**Steps:**
- Implement Zod schemas for the TOML config file.
- Implement config directory creation, default config loading, TOML parsing, saving, and team lookup.
- Implement the SQLite client singleton using `better-sqlite3`.
- Add the initial migration for memory index, session logs, and toggle state.
- Add focused tests for default config, saved config, team lookup failure, DB open, and migration idempotency.

**Acceptance check:** Config loads with defaults when missing, SQLite opens, migrations run repeatedly without error, and related tests pass.

## Phase 3 - Memory Writer And Reader

**Goal:** Support creating and loading git-backed memory entries.

**Steps:**
- Implement memory file path generation, markdown rendering, metadata population, and `index.jsonl` append behavior.
- Implement memory markdown parsing with frontmatter and known section headings.
- Implement recursive loading from the memory repo and local BM25 token preparation.
- Compute recency decay scores during indexing.
- Add round-trip tests using temporary directories.

**Acceptance check:** A memory entry can be written, read back, and matched field-for-field; tokenization and decay behavior are covered by tests.

## Phase 4 - Search And Token Budgeting

**Goal:** Provide local-first memory retrieval with optional semantic reranking.

**Steps:**
- Implement BM25 scoring and top-N filtering.
- Implement embedding loading from the memory repo and optional query embedding generation.
- Implement semantic reranking with safe fallback to BM25 ordering.
- Implement intent-based token budgets and memory formatting.
- Expose a unified `searchMemory()` function.

**Acceptance check:** Sample memories return relevant keyword matches, semantic failures do not break search, and formatted output stays within the intended token budget range.

## Phase 5 - Playbook Engine

**Goal:** Parse playbooks and execute their steps through configured agents.

**Steps:**
- Implement YAML playbook loading, validation, and listing.
- Render step prompts with Handlebars using task, spec path, and current working directory.
- Implement agent execution adapters for Claude Code and Codex.
- Keep manual checkpoint handling in the command layer.
- Add tests for valid playbooks, invalid playbooks, default values, and prompt rendering.

**Acceptance check:** Starter playbooks parse correctly and rendered prompts include the expected task substitution.

## Phase 6 - CLI Commands

**Goal:** Wire core behavior to a usable `agentlayer` command.

**Steps:**
- Implement the Commander entrypoint and register all commands.
- Implement `init`, `run`, `spec`, `log`, `digest`, `sync`, `toggle`, `memory`, and `learn`.
- Keep each command as orchestration only; move reusable behavior into core modules.
- Ensure `init` creates project-local `.agentlayer/` scaffolding from starter templates.
- Ensure `log`, `digest`, and hook-driven flows can write and commit memory entries.

**Acceptance check:** `agentlayer --help` lists commands, `agentlayer init` succeeds inside a project repo, and `agentlayer log` writes to `.agentlayer/memory`.

## Phase 7 - MCP Server

**Goal:** Expose project memory to coding agents through MCP.

**Steps:**
- Implement an MCP stdio server.
- Register `agentlayer_query` for memory lookup and `agentlayer_log` for writing decisions.
- Load the same config and memory core modules used by the CLI.
- Add a session cache keyed by module and intent.
- Respect global disable behavior and return quiet output when disabled.

**Acceptance check:** The MCP server starts, `tools/list` returns the expected tools, `agentlayer_query` returns formatted memory context, and repeated equivalent queries use cache.

## Phase 8 - Starter Playbooks And Templates

**Goal:** Ship useful defaults for new projects.

**Steps:**
- Add starter playbooks for API feature work, module refactors, and bug triage.
- Add bundled templates for specs, memory entries, and playbook creation.
- Add starter memory files for global patterns, rejected approaches, project constraints, module memory, embeddings, and `index.jsonl`.
- Ensure `agentlayer init` copies these templates into the project-local `.agentlayer/` directory.

**Acceptance check:** Starter templates are copied correctly and all starter playbooks parse without errors.

## Phase 9 - MCP Integration Documentation

**Goal:** Document how users connect agentlayer to common AI coding agents.

**Steps:**
- Document Claude Code MCP setup with `.claude/settings.json`.
- Document Codex MCP setup with `codex.config.json`.
- Include team selection behavior and environment variable notes.
- Keep examples copyable and scoped to `@ashirwad-shetye/agentlayer-mcp`.

**Acceptance check:** Integration docs contain valid JSON examples for Claude Code and Codex.

## Phase 10 - Tests

**Goal:** Build confidence in all core behavior before open-source polish.

**Steps:**
- Add tests for memory writer, reader, search, BM25, token budgeting, playbook parser, config loader, SQLite migration, and MCP cache.
- Use real temp directories for filesystem-heavy tests.
- Add command-level smoke tests where practical.
- Keep tests deterministic and independent of external services.

**Acceptance check:** `pnpm test` passes and core module coverage is at least 80%.

## Phase 11 - Open-Source Readiness

**Goal:** Prepare the repo for contributors and publishing.

**Steps:**
- Rewrite the root README with purpose, install, quick start, how it works, MCP integration, contributing, and license sections.
- Add docs for contributing, playbook schema, memory schema, getting started, and MCP integration.
- Add CI for install, build, typecheck, and tests.
- Add publish workflow for tagged npm releases.
- Verify package metadata, exports, bins, and docs match the final command names.

**Acceptance check:** CI config is present, docs are complete enough for first-time contributors, and package metadata is ready for npm publishing.

## Build Order Checklist

| Phase | Output |
| --- | --- |
| 0 | Monorepo builds with placeholders |
| 1 | Shared types and utilities compile |
| 2 | Config loads and SQLite migrates |
| 3 | Memory entries round-trip from disk |
| 4 | Search returns ranked, budgeted context |
| 5 | Playbooks parse and render prompts |
| 6 | CLI commands are registered and usable |
| 7 | MCP tools respond over stdio |
| 8 | Starter templates copy and parse |
| 9 | MCP integration docs are valid |
| 10 | Test suite passes with core coverage |
| 11 | README, docs, CI, and publish workflow are ready |
