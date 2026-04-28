# AgentLayer

AgentLayer is a git-native memory and workflow layer for AI-assisted development teams. It gives developers and coding agents a shared local context store, playbook-driven execution flow, and an MCP server that can surface prior decisions before new changes are made.

## Install

AgentLayer currently targets Node 22 LTS.

```bash
nvm use 22
```

```bash
npm install -g @ashirwad-shetye/agentlayer-cli
```

## Quick Start

Initialize AgentLayer inside the current project repo:

```bash
agentlayer init
```

Create a spec or run a playbook:

```bash
agentlayer spec "Add audit trail for billing changes"
agentlayer run api-feature --task "Add audit trail for billing changes"
```

Log a useful decision into project memory:

```bash
agentlayer log
```

Search prior project memory:

```bash
agentlayer memory search "Why did we change token rotation?"
```

For the recommended team workflow and agent-instruction patterns, see [Best Practices](docs/best-practices.md).

## Team Setup Example

A team using AgentLayer now commits project-local metadata directly in the working repo:

- `.agentlayer/playbooks/` for shared workflows
- `.agentlayer/templates/` for spec and memory templates
- `.agentlayer/memory/` for decisions, patterns, and rejected approaches

One developer or tech lead bootstraps the project once at the repo root:

```bash
agentlayer init
```

That creates:

- `.agentlayer/playbooks`
- `.agentlayer/templates`
- `.agentlayer/memory`

That `.agentlayer/` directory should be committed with the project, except for local cache artifacts ignored by `.gitignore`.

## Developer Setup Example

A single developer on the team typically does three things on a new machine:

1. Install the CLI:

```bash
npm install -g @ashirwad-shetye/agentlayer-cli
```

2. Pull the working project repo, including `.agentlayer/`:

```bash
git clone git@github.com:acme/product-repo.git
cd product-repo
```

3. Run AgentLayer against the project-local data:

```bash
agentlayer memory search "How do we handle auth token rotation?"
agentlayer memory search "What are the constraints around billing webhooks?"
```

## Coding Agent Example

AgentLayer is meant to sit beside tools like Codex and Claude Code, not replace them.

Example workflow with Codex:

1. A developer starts a task:

```bash
agentlayer run api-feature --task "Add audit trail for billing changes"
```

2. Codex works through the playbook with shared context already loaded.

3. After the implementation, the developer records the useful decision:

```bash
agentlayer log
```

4. On a later task, either the developer or the agent can query the prior reasoning:

```bash
agentlayer memory search "Why did we add billing audit trails?"
```

## MCP Agent Setup Example

When a team wants coding agents to query memory automatically during development, they add the MCP server to their agent config.

Example `codex.config.json`:

```json
{
  "mcp": {
    "servers": [
      {
        "name": "agentlayer",
        "transport": "stdio",
        "command": "npx @ashirwad-shetye/agentlayer-mcp"
      }
    ]
  }
}
```

Example `.claude/settings.json`:

```json
{
  "mcpServers": {
    "agentlayer": {
      "command": "npx",
      "args": ["@ashirwad-shetye/agentlayer-mcp"],
      "env": {}
    }
  }
}
```

With that in place, the coding agent can call:

- `agentlayer_query` before making architectural or module-level changes
- `agentlayer_log` after making a meaningful decision worth preserving

See [Best Practices](docs/best-practices.md) for copy-paste instruction text for `AGENTS.md`, Codex, and Claude project rules.

## Daily Usage Example

A realistic day-to-day loop for a developer team looks like this:

```bash
agentlayer sync
agentlayer memory search "What is the current pattern for admin filters?"
agentlayer spec "Refactor venue filters to share mobile and desktop logic"
agentlayer run refactor-module --task "Refactor venue filters to share mobile and desktop logic"
agentlayer digest
```

## How It Works

`@ashirwad-shetye/agentlayer-cli` manages setup, playbooks, memory logging, and project-local repo orchestration. `@ashirwad-shetye/agentlayer-mcp` exposes the same memory and logging capabilities to MCP-compatible coding agents over stdio. Shared project knowledge lives in the repo’s committed `.agentlayer/` directory, while AgentLayer keeps a machine-local SQLite index for fast access.

## Packages

- `@ashirwad-shetye/agentlayer-cli`: global CLI entrypoint and core business logic
- `@ashirwad-shetye/agentlayer-mcp`: MCP server for coding agents
- `@ashirwad-shetye/agentlayer-shared`: shared types and utilities

## Documentation

- [Getting Started](docs/getting-started.md)
- [Best Practices](docs/best-practices.md)
- [MCP Integration](docs/mcp-integration.md)
- [Playbook Schema](docs/playbook-schema.md)
- [Memory Schema](docs/memory-schema.md)
- [Contributing](docs/contributing.md)

## Runtime Notes

- Supported Node runtime: `22.x`
- The local config file is `~/.agentlayer/config.toml`.
- The local SQLite index is `~/.agentlayer/index.db`.
- Project-local AgentLayer data lives in `.agentlayer/` at the repo root.
- Node 24 is not currently supported for the published CLI because `better-sqlite3` install/build behavior is unreliable there.
- `better-sqlite3` requires native build approval in environments where package build scripts are blocked.
- Semantic reranking is optional and only activates when embeddings exist and a provider is configured.

## License

See [LICENSE](LICENSE).
