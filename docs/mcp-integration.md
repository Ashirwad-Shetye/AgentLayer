# MCP Integration

AgentLayer exposes an MCP server through `@ashirwad-shetye/agentlayer-mcp`. The server reads the same local config and project-local `.agentlayer/` data used by the CLI.

## Project resolution

The MCP server resolves the active AgentLayer context from the current project:

1. prefer the current git repo root
2. fall back to the current working directory if no git root exists

It then reads `.agentlayer/` inside that project.

## Claude Code

Commit this snippet to `.claude/settings.json` in a repository where Claude Code should use AgentLayer:

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

## Codex

Use this in `codex.config.json`:

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

## Available tools

- `agentlayer_query`: fetches relevant project memory for a natural-language question and optional module scope.
- `agentlayer_log`: records a decision and reason into project-local memory.

## Notes

- AgentLayer is local-first. The MCP server reads local config and git-backed memory files.
- The project repo should commit `.agentlayer/playbooks`, `.agentlayer/templates`, and `.agentlayer/memory`.
- If `globalEnabled` is disabled in config, the server returns empty context.
- Semantic reranking only activates when embeddings are present and an embedding provider is configured.
