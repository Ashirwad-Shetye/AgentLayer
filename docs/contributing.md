# Contributing

## Local Setup

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

If `better-sqlite3` native scripts are blocked in your environment, run the package-manager approval flow before testing runtime DB behavior.

## Monorepo Layout

- `packages/cli`: CLI entrypoint, command layer, config, DB, memory, optimizer, and playbook core
- `packages/mcp`: MCP server and session cache
- `packages/shared`: shared types and utilities
- `templates`: starter playbook and memory repos used by `agentlayer init --local`
- `docs`: end-user and contributor documentation

## Adding A CLI Command

1. Add a new file under `packages/cli/src/commands/`.
2. Export a single `register*` function that accepts Commander’s `Command`.
3. Keep orchestration in the command file and move reusable logic into `packages/cli/src/core/**`.
4. Register the command in [packages/cli/src/index.ts](/Users/ashirwadshetye/Desktop/projects/AgentLayer/packages/cli/src/index.ts).
5. Add tests if the command introduces new core behavior.

## Adding A Playbook

1. Add a YAML file under `templates/playbooks-repo/playbooks/`.
2. Follow the schema documented in [playbook-schema.md](/Users/ashirwadshetye/Desktop/projects/AgentLayer/docs/playbook-schema.md).
3. Keep prompts concrete and scoped to one phase of work at a time.
4. Prefer manual checkpoints when a human should validate output before proceeding.

## Adding An MCP Tool

1. Add the tool description to [packages/mcp/src/server.ts](/Users/ashirwadshetye/Desktop/projects/AgentLayer/packages/mcp/src/server.ts).
2. Reuse CLI core/config modules rather than duplicating logic inside `mcp`.
3. Keep the tool input schema explicit and JSON-serializable.
4. Add focused tests if you introduce standalone MCP-only behavior.

## PR Checklist

- `pnpm build` passes
- `pnpm test` passes
- `pnpm typecheck` passes
- docs updated for user-facing behavior changes
- new exported APIs are intentional and documented
