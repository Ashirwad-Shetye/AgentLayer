# Best Practices

This document shows the recommended way to use AgentLayer in day-to-day development and with coding agents such as Codex and Claude Code.

## Core Operating Model

Use AgentLayer for two things:

1. query project memory before changing unfamiliar code
2. log durable decisions after meaningful implementation work

Do not treat chat history as the source of truth. If a decision matters later, it should end up in `.agentlayer/memory/`.

## When To Query Memory

Query AgentLayer before:

- changing an unfamiliar module
- making an architectural decision
- debugging behavior with likely prior context
- revisiting a rejected approach
- starting a refactor in a sensitive area

Examples:

```bash
agentlayer memory search "Why does dashboard analytics use polling instead of webhooks?" --intent understand
agentlayer memory search "What are the current auth token rotation constraints?" --module src/auth --intent debug
```

## When To Log Memory

Log memory after:

- finishing a feature with non-obvious reasoning
- completing a refactor with design tradeoffs
- fixing a bug with an important root cause
- rejecting an implementation option
- discovering a reusable project pattern

Do not log:

- trivial formatting edits
- obvious mechanical changes
- unfinished thoughts with no durable value

## What A Good Memory Entry Contains

A useful memory entry usually includes:

- `module`
- `task`
- `decision`
- `reason`
- `rejected`
- `tradeoff accepted`
- `open`
- `reusable pattern`

The most important fields are `decision` and `reason`. If those are weak, retrieval quality drops even when search is working correctly.

## Recommended Human Workflow

Use this loop for normal development:

```bash
agentlayer sync
agentlayer memory search "What is the current pattern for dashboard refresh?" --intent understand
agentlayer spec "Add analytics trend cards to the dashboard"
agentlayer run api-feature --task "Add analytics trend cards to the dashboard"
agentlayer log --module src/dashboard
```

If you want to summarize a completed agent session into project memory:

```bash
agentlayer digest --module src/dashboard
```

## Recommended Coding-Agent Workflow

With MCP connected, talk to the coding agent in plain language. You do not need a special slash command.

Good prompts:

- "Check AgentLayer memory before changing dashboard analytics."
- "Use AgentLayer to find why polling was chosen over webhooks."
- "After finishing this implementation, log the final decision to AgentLayer memory."

The agent should use:

- `agentlayer_query` before implementation when prior context matters
- `agentlayer_log` after implementation when a durable decision was made

## Recommended Repo Rule

Add a rule like this to `AGENTS.md`, Codex instructions, or Claude project instructions:

```md
## AgentLayer Rule

Before modifying an unfamiliar module or making a meaningful implementation decision, query AgentLayer for relevant project memory.

After completing a meaningful implementation task, record the final decision in AgentLayer memory.

Each memory entry should include:
- module
- task
- decision
- reason
- rejected alternative when applicable
- tradeoff accepted when applicable
- open follow-up when applicable
- reusable pattern when applicable

Do not log trivial or purely mechanical edits.
```

## Example Codex Instruction

This shorter version works well in agent-specific instruction files:

```md
Use AgentLayer as part of normal implementation workflow. Query project memory before changing unfamiliar code, and log meaningful decisions after completing planned implementation work. Prefer structured AgentLayer memory over leaving important reasoning only in chat history.
```

## Example Claude Project Instruction

```md
When working in this repository, check AgentLayer memory before making important changes in unfamiliar areas. After implementing a meaningful change, write the decision and reasoning back to AgentLayer memory.
```

## Retrieval Expectations

AgentLayer search does not require word-for-word matches.

Current retrieval works by combining:

- keyword/BM25 search
- module filtering
- optional semantic reranking when embeddings are available

That means a question like:

> Why was dashboard analytics built with polling instead of webhooks?

can still match memory entries that mention:

- delayed refresh tolerance
- unreliable third-party event delivery
- rejected webhook architecture
- dashboard polling cadence

Better memory quality produces better retrieval quality.
