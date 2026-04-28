# AgentLayer

AgentLayer is a git-native memory and workflow layer for AI-assisted development teams. It gives developers and coding agents a shared local context store, playbook-driven execution flow, and an MCP server that can surface prior decisions before new changes are made.

## Install

```bash
npm install -g @agentlayer/cli
```

## Quick Start

Initialize a team locally:

```bash
agentlayer init --local --team acme
```

Create a spec or run a playbook:

```bash
agentlayer spec "Add audit trail for billing changes"
agentlayer run api-feature --task "Add audit trail for billing changes"
```

Log a useful decision into team memory:

```bash
agentlayer log
```

Search prior team memory:

```bash
agentlayer memory search "Why did we change token rotation?"
```

## Team Setup Example

A team usually keeps two repos:

- a playbooks repo for shared workflows and templates
- a memory repo for decisions, patterns, and rejected approaches

One developer or tech lead can bootstrap them locally first:

```bash
agentlayer init --local --team acme
```

That creates:

- `~/.agentlayer/repos/acme/playbooks`
- `~/.agentlayer/repos/acme/memory`

Once those starter repos are reviewed and pushed to your Git host, other developers can point AgentLayer at the shared copies:

```bash
agentlayer init \
  --team acme \
  --playbooks-repo git@github.com:acme/agentlayer-playbooks.git \
  --memory-repo git@github.com:acme/agentlayer-memory.git
```

## Developer Setup Example

A single developer on the team typically does three things on a new machine:

1. Install the CLI:

```bash
npm install -g @agentlayer/cli
```

2. Connect to the shared team repos:

```bash
agentlayer init \
  --team acme \
  --playbooks-repo git@github.com:acme/agentlayer-playbooks.git \
  --memory-repo git@github.com:acme/agentlayer-memory.git
```

3. Check memory before touching an unfamiliar area:

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
        "command": "npx @agentlayer/mcp --team acme"
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
      "args": ["@agentlayer/mcp", "--team", "acme"],
      "env": {}
    }
  }
}
```

With that in place, the coding agent can call:

- `agentlayer_query` before making architectural or module-level changes
- `agentlayer_log` after making a meaningful decision worth preserving

## Daily Usage Example

A realistic day-to-day loop for a developer team looks like this:

```bash
agentlayer sync --team acme
agentlayer memory search "What is the current pattern for admin filters?"
agentlayer spec "Refactor venue filters to share mobile and desktop logic"
agentlayer run refactor-module --task "Refactor venue filters to share mobile and desktop logic"
agentlayer digest --team acme
```

## How It Works

`@agentlayer/cli` manages setup, playbooks, memory logging, and local repo orchestration. `@agentlayer/mcp` exposes the same memory and logging capabilities to MCP-compatible coding agents over stdio. Team memory and playbooks live in local or organization-owned git repos, while AgentLayer keeps a local SQLite index for fast access.

## Packages

- `@agentlayer/cli`: global CLI entrypoint and core business logic
- `@agentlayer/mcp`: MCP server for coding agents
- `@agentlayer/shared`: shared types and utilities

## Documentation

- [Getting Started](/Users/ashirwadshetye/Desktop/projects/AgentLayer/docs/getting-started.md)
- [MCP Integration](/Users/ashirwadshetye/Desktop/projects/AgentLayer/docs/mcp-integration.md)
- [Playbook Schema](/Users/ashirwadshetye/Desktop/projects/AgentLayer/docs/playbook-schema.md)
- [Memory Schema](/Users/ashirwadshetye/Desktop/projects/AgentLayer/docs/memory-schema.md)
- [Contributing](/Users/ashirwadshetye/Desktop/projects/AgentLayer/docs/contributing.md)

## Runtime Notes

- The local config file is `~/.agentlayer/config.toml`.
- The local SQLite index is `~/.agentlayer/index.db`.
- `better-sqlite3` requires native build approval in environments where package build scripts are blocked.
- Semantic reranking is optional and only activates when embeddings exist and a provider is configured.

## License

See [LICENSE](/Users/ashirwadshetye/Desktop/projects/AgentLayer/LICENSE).
