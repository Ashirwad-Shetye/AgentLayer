# Memory Schema

AgentLayer stores project memory as markdown files with frontmatter plus fixed section headings.

## Frontmatter

- `date`: ISO date string
- `module`: module or scope, for example `src/auth` or `global`
- `task`: short task label
- `developer`: author name, usually from git config
- `agent`: one of `claude-code`, `codex`, `cursor`, or `other`
- `tokensUsed`: optional token count
- `tags`: list of classification tags
- `commit`: optional git SHA
- `playbookUsed`: optional playbook name

## Sections

- `## decision`: what was decided or implemented
- `## reason`: why that approach was chosen
- `## rejected`: optional rejected alternative
- `## tradeoff accepted`: optional acknowledged downside
- `## open`: optional unresolved follow-up
- `## reusable pattern`: optional pattern or prompt future developers can reuse

## Example

```md
---
date: 2026-04-28
module: src/auth
task: rotate access tokens
developer: A. Engineer
agent: codex
tags: [auth, tokens]
commit: abc1234
---

## decision
Use short-lived access tokens with refresh rotation.

## reason
This reduces replay exposure and aligns with our session invalidation flow.

## rejected
Long-lived bearer tokens.

## tradeoff accepted
More refresh traffic.

## open
Monitor mobile refresh failure rates.

## reusable pattern
Prefer keyword-first search before semantic rerank for policy questions.
```

## Good Entries

- specific decision statement
- concrete reason tied to system constraints
- scoped module ownership
- enough detail for the next engineer to act on

## Weak Entries

- vague notes like "fixed auth issue"
- no reason or rejected alternative
- missing module scope
- no follow-up when unresolved work remains
