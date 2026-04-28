# Playbook Schema

Playbooks are YAML files that describe a repeatable AI-assisted workflow.

## Top-Level Fields

- `name`: unique playbook name used by `agentlayer run <name>`
- `description`: short summary shown in listings
- `agent`: target agent family, one of `claude-code`, `codex`, `cursor`, or `any`
- `version`: semantic version string for the playbook definition
- `contextStrategy`: inclusion and budget hints for future context assembly
- `steps`: ordered execution steps
- `tags`: optional classification tags
- `author`: optional maintainer name

## `contextStrategy`

- `include`: glob-like paths that should be considered primary context
- `exclude`: paths that should be ignored
- `summarize`: paths that should be summarized rather than included verbatim
- `maxTokens`: upper bound for context assembly
- `priorityFiles`: files that should get first priority in a limited budget

## `steps[]`

Each step contains:

- `name`: stable step label
- `prompt`: prompt template rendered with Handlebars
- `checkpoint`: optional description of what should be verified after the step
- `checkpointAuto`: whether the agent is expected to self-validate
- `timeoutMinutes`: timeout budget for the agent invocation

## Prompt Variables

Current templates can rely on:

- `{{task}}`
- `{{specPath}}`
- `{{cwd}}`
- `{{teamName}}`

## Minimal Example

```yaml
name: bug-triage
description: Reproduce and fix a bug
agent: codex
version: 1.0.0

contextStrategy:
  include:
    - src/
    - tests/
  exclude:
    - node_modules/
    - dist/
  summarize:
    - docs/
  maxTokens: 60000

steps:
  - name: reproduce
    prompt: |
      Task: {{task}}
      Write a short reproduction note in spec.md.
    checkpointAuto: false

  - name: fix
    prompt: |
      Implement the smallest coherent fix and update tests.
    checkpointAuto: false
```
