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
agentlayer memory logs --limit 20
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
- `agentlayer_log` before creating a commit or PR when meaningful work produced durable project memory

## How Agents Should Query Memory

For MCP-based agent retrieval, do not rely only on the raw question when richer task context is available.

Good retrieval context includes:

- the direct question
- current task or plan step
- primary module
- relevant file paths
- current error when debugging
- a few extracted keywords

Examples of better agent prompts:

- "Before changing auth rotation, query AgentLayer with the current task, module, and affected files."
- "While debugging webhook retries, include the current error and module in the AgentLayer query."
- "Before this refactor, check AgentLayer for prior decisions using the task, module, and review intent."

Use prompt-shaped retrieval at these moments:

- before changing unfamiliar modules
- before architectural decisions
- before refactors in sensitive areas
- during debugging when prior decisions may explain current behavior
- during reviews when constraints or rejected approaches matter

## Recommended Repo Rule

Add a rule like this to `AGENTS.md`, Codex instructions, or Claude project instructions:

```md
## AgentLayer Rule

Use AgentLayer as the project memory layer.

Before changing unfamiliar modules, making architectural decisions, debugging non-obvious behavior, reviewing sensitive code, or starting a meaningful refactor, call `agentlayer_query` with prompt-shaped context:
- direct question
- current task or plan step
- primary module
- relevant file paths
- current error when debugging
- useful keywords
- intent: `understand`, `extend`, `debug`, or `review`

After completing meaningful implementation work, and before creating a commit or PR, call `agentlayer_log` when the work produced a durable decision, tradeoff, rejected approach, bug root cause, or reusable pattern.

Each memory log should include:
- decision
- reason
- module
- rejected alternative when applicable
- tradeoff accepted when applicable
- open follow-up when applicable
- reusable pattern when applicable
- tags

Do not log trivial or mechanical changes, including formatting-only edits, import cleanup, typo fixes, lockfile-only changes, generated-file updates, or incomplete work.

When committing or opening a PR after logging, include the `.agentlayer/memory` changes with the code changes so project memory and implementation history stay together.
```

## Example Codex Instruction

This shorter version works well in agent-specific instruction files:

```md
Use AgentLayer as part of normal implementation workflow. Query project memory with prompt-shaped context before changing unfamiliar code. After meaningful implementation work, and before creating a commit or PR, log durable decisions to AgentLayer and include `.agentlayer/memory` changes with the related code changes.
```

## Example Claude Project Instruction

```md
When working in this repository, check AgentLayer memory before making important changes in unfamiliar areas. After implementing a meaningful change, write the decision and reasoning back to AgentLayer memory before committing or opening a PR.
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
