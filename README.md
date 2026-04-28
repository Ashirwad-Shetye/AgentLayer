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
