# AgentLayer Repository Guidelines

## Project Purpose

AgentLayer builds `agentlayer`: an open-source CLI tool and MCP server that provides git-native institutional memory for developer teams using AI coding agents such as Codex, Claude Code, and Cursor.

The product must keep team knowledge local, inspectable, and versioned in the user's own git repositories. It should be usable through a global npm install and should expose clean library exports for reuse by other tools.

## Hard Constraints

- Use TypeScript strict mode throughout the repo.
- Do not use `any`. If a value is uncertain, use `unknown` and narrow it explicitly.
- Keep persistence local-first and file-backed unless a clear product requirement justifies something heavier.
- Do not introduce running daemons. All work must happen on demand or through subprocesses.
- Keep team data local or in organization-owned git repos. External calls must be explicit user-initiated API calls.
- `npm install -g @ashirwad-shetye/agentlayer-cli` should be the only install step required for end users.
- Every module must be independently testable with Vitest.
- Keep package exports clean because the repo is intended for open-source and library use.

## Architecture Guidelines

- Use a pnpm monorepo with `packages/cli`, `packages/mcp`, and `packages/shared`.
- Put shared types and utilities in `@ashirwad-shetye/agentlayer-shared`.
- Keep CLI command files thin. They should parse arguments, load config, call core modules, print results, and handle process exits.
- Keep business logic in `packages/cli/src/core/**` or shared packages, not in command registration files.
- Keep the MCP package focused on MCP transport, tools, context formatting, and session cache behavior.
- Avoid cross-package relative imports in published-facing code; prefer package exports once available.
- Export only the symbols other modules actually need. Keep internal helpers private.

## Coding Style

- Access environment variables with bracket notation, for example `process.env['EDITOR']`.
- Use `path.join()` and related path helpers instead of path string concatenation.
- Wrap git subprocess calls in `try/catch` when failure is expected or recoverable.
- Use `execSync` with `{ encoding: 'utf-8' }` when command output is read as text.
- In every `catch (err)` block, check `err instanceof Error` before reading `.message`.
- Use `async`/`await` instead of `.then()` chains.
- Prefer structured parsers and schema validation over ad hoc string parsing when the format supports it.
- Add comments only where they clarify non-obvious behavior.

## Data And Privacy Rules

- The config file lives under `~/.agentlayer/config.toml`.
- Machine-local AgentLayer settings live under `~/.agentlayer/config.toml`.
- Playbook and memory data should live in git repositories managed by the user or their organization.
- Memory entries are markdown files with frontmatter and stable section headings.
- Embeddings, if generated, must be stored locally in the memory repo.
- API-backed embedding or distillation behavior must degrade gracefully when credentials or services are unavailable.

## Testing Guidelines

- Use Vitest for unit and integration tests.
- Prefer real temporary directories for filesystem tests instead of mocking the filesystem.
- Cover core modules first: config loading, memory read/write, indexing/search, token budgeting, playbook parsing, and MCP cache behavior.
- Each phase of implementation must end with a working, testable state.
- Do not proceed to a later implementation phase until the previous phase's acceptance check passes.

## Agent Workflow

- Treat the original detailed source plan as reference material and `plan.md` as the concise implementation tracker.
- Work phase by phase in the order described in `plan.md`.
- Preserve existing user changes. Do not revert unrelated work.
- Before adding a dependency, confirm it aligns with the constraints in this file.
- When implementing a CLI command, first identify the core module it should delegate to.
- When implementing MCP tools, reuse CLI core modules rather than duplicating behavior.
- Keep documentation updated when behavior, command names, schemas, or setup steps change.
