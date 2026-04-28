# MCP Integration

AgentLayer exposes an MCP server through `@agentlayer/mcp`. The server reads the same local config and team memory repositories used by the CLI.

## Team selection

The MCP server resolves the team in this order:

1. `AGENTLAYER_TEAM` environment variable
2. `--team <name>` process argument
3. `defaultTeam` from `~/.agentlayer/config.toml`

If no team can be resolved, the server returns a configuration error message instead of context.

## Claude Code

Commit this snippet to `.claude/settings.json` in a repository where Claude Code should use AgentLayer:

```json
{
  "mcpServers": {
    "agentlayer": {
      "command": "npx",
      "args": ["@agentlayer/mcp", "--team", "YOUR_TEAM_NAME"],
      "env": {}
    }
  }
}
```

## Codex

Use this in `codex.config.json`:

```json
{
  "mcp": {
    "servers": [
      {
        "name": "agentlayer",
        "transport": "stdio",
        "command": "npx @agentlayer/mcp --team YOUR_TEAM_NAME"
      }
    ]
  }
}
```

## Available tools

- `agentlayer_query`: fetches relevant team memory for a natural-language question and optional module scope.
- `agentlayer_log`: records a decision and reason into the team memory repository.

## Notes

- AgentLayer is local-first. The MCP server reads local config and git-backed memory files.
- If `globalEnabled` is disabled in config, the server returns empty context.
- Semantic reranking only activates when embeddings are present and an embedding provider is configured.
