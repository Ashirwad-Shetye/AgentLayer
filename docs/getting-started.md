# Getting Started

1. Install the CLI globally:

```bash
npm install -g @ashirwad-shetye/agentlayer-cli
```

2. Initialize AgentLayer in the current project repo:

```bash
agentlayer init
```

3. Create a spec or run a playbook:

```bash
agentlayer spec "Add audit trail for billing updates"
agentlayer run api-feature --task "Add audit trail for billing updates"
```

4. Log a useful implementation decision:

```bash
agentlayer log
```

For non-interactive scripts, pass the required decision and reason explicitly:

```bash
agentlayer log --auto \
  --module src/dashboard \
  --task "Dashboard analytics refresh strategy" \
  --decision "Keep dashboard analytics on bounded polling." \
  --reason "Provider webhook coverage is incomplete for all visible metrics."
```

5. Query shared memory:

```bash
agentlayer memory search "Why did we switch auth token handling?"
agentlayer memory logs --limit 20
```

6. If you are using Codex or Claude Code with the MCP server, prefer prompt-shaped retrieval:

- ask the agent to check AgentLayer before changing unfamiliar code
- include task, module, affected files, or the current error when that context matters
- let the agent use `agentlayer_query` with that structured context before implementation or debugging
