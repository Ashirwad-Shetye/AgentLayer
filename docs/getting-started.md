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

5. Query shared memory:

```bash
agentlayer memory search "Why did we switch auth token handling?"
```
