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

- `agentlayer_query`: fetches relevant project memory for a natural-language question plus optional retrieval context such as task, module, files, error, keywords, agent, and work phase.
- `agentlayer_log`: records a decision and reason into project-local memory.

## Prompt-Shaped Retrieval

For MCP-based coding agents, AgentLayer no longer needs to search with only the raw user sentence.

The recommended model is:

1. keep the direct question
2. add current task or plan-step context
3. add module and relevant file paths
4. include the current error when debugging
5. include a few extracted keywords when they matter

AgentLayer compiles that structured context into retrieval text before BM25 ranking and optional semantic reranking.

## `agentlayer_query` input shape

Required:

- `query`: the direct question

Optional:

- `module`: primary module or scope
- `intent`: `understand`, `extend`, `debug`, or `review`
- `task`: current implementation task or plan step
- `files`: relevant file paths
- `error`: current error or failure signal
- `keywords`: extracted terms that should influence retrieval
- `agent`: current agent identifier
- `phase`: `planning`, `implementation`, `debugging`, or `review`

## Examples

Simple legacy-compatible query:

```json
{
  "query": "Why does dashboard analytics use polling instead of webhooks?",
  "module": "src/dashboard",
  "intent": "understand"
}
```

Structured context query:

```json
{
  "query": "Why does dashboard analytics use polling instead of webhooks?",
  "task": "Refactor dashboard analytics refresh flow",
  "module": "src/dashboard",
  "files": ["src/dashboard/view.tsx", "src/dashboard/api.ts"],
  "keywords": ["analytics", "refresh cadence", "webhooks"],
  "phase": "implementation",
  "intent": "understand"
}
```

Debugging query with current failure context:

```json
{
  "query": "What prior decisions explain webhook retry behavior?",
  "task": "Debug webhook retries",
  "module": "src/webhooks",
  "files": ["src/webhooks/retries.ts"],
  "error": "Retry queue drained without updating delivery status",
  "keywords": ["retries", "delivery status", "idempotency"],
  "phase": "debugging",
  "intent": "debug"
}
```

## Recommended Agent Usage

Use prompt-shaped retrieval at these moments:

- before changing unfamiliar modules
- before architectural decisions
- before refactors in sensitive areas
- during debugging when prior decisions may explain current behavior
- during reviews when constraints or rejected approaches matter

Do not require it for trivial or purely mechanical edits.

## Notes

- AgentLayer is local-first. The MCP server reads local config and git-backed memory files.
- The project repo should commit `.agentlayer/playbooks`, `.agentlayer/templates`, and `.agentlayer/memory`.
- If `globalEnabled` is disabled in config, the server returns empty context.
- Semantic reranking only activates when embeddings are present and an embedding provider is configured.
