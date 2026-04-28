# agentkit — build plan

> Hand this entire file to Codex. Every section is a self-contained prompt.
> Work top-to-bottom. Each phase produces working, testable output before the next begins.

---

## context & constraints

You are building **agentkit** — an open-source CLI tool and MCP server that acts as a git-native institutional memory layer for developer teams using AI coding agents (Codex, Claude Code, Cursor, etc.).

**Hard constraints for every file you write:**
- TypeScript strict mode, no `any` types
- No external database — SQLite only, via `better-sqlite3`
- No running daemons — everything is on-demand or subprocess
- All team data stays local or in the org's own git repos — nothing goes to external services except explicit user-initiated API calls
- `npm install -g` is the only install step a user should ever need
- Every module must be independently testable with vitest
- Exports must be clean — this will be open-sourced and used as a library too

---

## folder structure

Create this exact structure before writing any code. Every folder gets a `README.md` stub explaining its purpose.

```
agentkit/
├── packages/
│   ├── cli/                        # @agentkit/cli — the npm global install
│   │   ├── src/
│   │   │   ├── commands/           # one file per CLI command
│   │   │   │   ├── init.ts
│   │   │   │   ├── run.ts
│   │   │   │   ├── spec.ts
│   │   │   │   ├── log.ts
│   │   │   │   ├── digest.ts
│   │   │   │   ├── sync.ts
│   │   │   │   ├── toggle.ts
│   │   │   │   ├── memory.ts       # memory search subcommand
│   │   │   │   └── learn.ts
│   │   │   ├── core/               # business logic, no CLI concerns
│   │   │   │   ├── playbook/
│   │   │   │   │   ├── parser.ts
│   │   │   │   │   ├── executor.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── spec/
│   │   │   │   │   ├── scaffolder.ts
│   │   │   │   │   └── templates.ts
│   │   │   │   ├── memory/
│   │   │   │   │   ├── writer.ts
│   │   │   │   │   ├── reader.ts
│   │   │   │   │   ├── indexer.ts
│   │   │   │   │   ├── search.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── optimizer/
│   │   │   │   │   ├── bm25.ts
│   │   │   │   │   ├── embeddings.ts
│   │   │   │   │   ├── budget.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── distiller/
│   │   │   │   │   ├── session-reader.ts
│   │   │   │   │   ├── extractor.ts
│   │   │   │   │   └── types.ts
│   │   │   │   └── git/
│   │   │   │       ├── sync.ts
│   │   │   │       ├── hooks.ts
│   │   │   │       └── blame.ts
│   │   │   ├── config/
│   │   │   │   ├── loader.ts       # reads ~/.agentkit/config.toml
│   │   │   │   ├── schema.ts       # zod schema for config
│   │   │   │   └── defaults.ts
│   │   │   ├── db/
│   │   │   │   ├── client.ts       # SQLite singleton
│   │   │   │   ├── migrations/
│   │   │   │   │   └── 001_init.sql
│   │   │   │   └── queries.ts
│   │   │   └── index.ts            # CLI entrypoint — wires commander
│   │   ├── bin/
│   │   │   └── agentkit.js         # thin shim, calls src/index.ts via tsx
│   │   ├── templates/              # bundled handlebars templates
│   │   │   ├── memory-entry.md.hbs
│   │   │   ├── spec.md.hbs
│   │   │   └── playbook.yml.hbs
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── mcp/                        # @agentkit/mcp — the MCP server
│   │   ├── src/
│   │   │   ├── server.ts           # MCP server entrypoint
│   │   │   ├── tools/
│   │   │   │   ├── query.ts        # agentkit_query tool handler
│   │   │   │   └── log.ts          # agentkit_log tool handler
│   │   │   ├── context/
│   │   │   │   ├── assembler.ts    # merges results into context block
│   │   │   │   └── formatter.ts    # formats for agent consumption
│   │   │   └── cache/
│   │   │       └── session.ts      # in-memory session cache
│   │   ├── bin/
│   │   │   └── agentkit-mcp.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                     # @agentkit/shared — types + utils used by both
│       ├── src/
│       │   ├── types/
│       │   │   ├── memory.ts
│       │   │   ├── playbook.ts
│       │   │   └── config.ts
│       │   ├── utils/
│       │   │   ├── tokens.ts       # token counting (tiktoken-lite)
│       │   │   ├── hash.ts
│       │   │   └── fs.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── templates/                      # starter repo templates (copied on agentkit init)
│   ├── playbooks-repo/
│   │   ├── .agentkit-manifest.yml
│   │   ├── playbooks/
│   │   │   ├── api-feature.yml
│   │   │   ├── refactor-module.yml
│   │   │   └── bug-triage.yml
│   │   └── templates/
│   │       ├── spec.md.hbs
│   │       └── memory-entry.md.hbs
│   └── memory-repo/
│       ├── modules/
│       │   └── .gitkeep
│       ├── global/
│       │   ├── patterns.md
│       │   ├── rejected.md
│       │   └── team-constraints.md
│       ├── embeddings/
│       │   └── .gitkeep
│       └── index.jsonl
│
├── docs/                           # documentation (auto-published to GitHub Pages)
│   ├── getting-started.md
│   ├── playbook-schema.md
│   ├── memory-schema.md
│   ├── mcp-integration.md
│   └── contributing.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # test + typecheck on PR
│       └── publish.yml             # npm publish on tag
│
├── package.json                    # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json                      # turborepo for build orchestration
├── tsconfig.base.json
└── README.md
```

---

## phase 0 — repo scaffolding

**Task:** Create the monorepo skeleton. Do not write any business logic yet.

### 0.1 — root workspace

Create `package.json`:
```json
{
  "name": "agentkit",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "dev": "turbo run dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "@types/node": "^20.0.0"
  }
}
```

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - "packages/*"
```

Create `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "dev": { "persistent": true }
  }
}
```

### 0.2 — package.json files

Create `packages/shared/package.json`:
```json
{
  "name": "@agentkit/shared",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./dist/index.js" },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

Create `packages/cli/package.json`:
```json
{
  "name": "@agentkit/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": { "agentkit": "./bin/agentkit.js" },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@agentkit/shared": "workspace:*",
    "commander": "^12.0.0",
    "inquirer": "^9.0.0",
    "better-sqlite3": "^9.4.0",
    "handlebars": "^4.7.0",
    "gray-matter": "^4.0.0",
    "js-yaml": "^4.1.0",
    "@iarna/toml": "^2.2.5",
    "zod": "^3.22.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "execa": "^8.0.0",
    "tiktoken": "^1.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/js-yaml": "^4.0.0",
    "@types/handlebars": "^4.0.0"
  }
}
```

Create `packages/mcp/package.json`:
```json
{
  "name": "@agentkit/mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": { "agentkit-mcp": "./bin/agentkit-mcp.js" },
  "dependencies": {
    "@agentkit/shared": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "better-sqlite3": "^9.4.0"
  }
}
```

### 0.3 — bin shims

Create `packages/cli/bin/agentkit.js`:
```js
#!/usr/bin/env node
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// In dev: use tsx to run TypeScript directly
// In prod: run compiled dist
const isDev = process.env.AGENTKIT_DEV === '1';
if (isDev) {
  const { register } = await import('tsx/esm');
  register();
  await import(join(__dirname, '../src/index.ts'));
} else {
  await import(join(__dirname, '../dist/index.js'));
}
```

Same pattern for `packages/mcp/bin/agentkit-mcp.js`.

**Acceptance check:** `pnpm install` runs cleanly. `pnpm build` produces no errors (even with empty src files with placeholder exports).

---

## phase 1 — shared types

**Task:** Define all types that both `cli` and `mcp` packages use. No logic yet.

### 1.1 — memory types (`packages/shared/src/types/memory.ts`)

```typescript
export type MemoryIntent = 'understand' | 'extend' | 'debug' | 'review'

export type MemoryEntryType = 'decision' | 'pattern' | 'rejected' | 'open_question' | 'gotcha'

export interface MemoryFrontmatter {
  date: string               // ISO date: 2025-04-22
  module: string             // src/auth or 'global'
  task: string
  developer: string          // git config user.name
  agent: 'claude-code' | 'codex' | 'cursor' | 'other'
  tokensUsed?: number
  tags: string[]
  commit?: string            // git SHA this is associated with
  playbookUsed?: string
}

export interface MemoryEntry {
  id: string                 // sha256 of date+module+developer, first 12 chars
  frontmatter: MemoryFrontmatter
  decision: string
  reason: string
  rejected?: string
  tradeoffAccepted?: string
  open?: string
  reusablePattern?: string
  rawMarkdown: string        // full file content
  filePath: string           // absolute path on disk
}

export interface IndexedMemory extends MemoryEntry {
  embedding?: Float32Array   // loaded from .bin file alongside .md
  bm25Tokens: string[]       // pre-tokenized for BM25
  decayScore: number         // 0-1, computed at index time
}

export interface MemorySearchResult {
  memory: IndexedMemory
  score: number
  matchType: 'bm25' | 'semantic' | 'hybrid'
}

export interface ModuleIndex {
  module: string
  entries: IndexedMemory[]
  lastBuilt: string          // ISO datetime
}
```

### 1.2 — playbook types (`packages/shared/src/types/playbook.ts`)

```typescript
export type AgentTarget = 'claude-code' | 'codex' | 'cursor' | 'any'

export interface ContextStrategy {
  include?: string[]         // glob patterns — always include
  exclude?: string[]         // glob patterns — always exclude
  summarize?: string[]       // glob patterns — include as summaries
  maxTokens?: number         // default: 80000
  priorityFiles?: string[]   // always include, highest priority slot
}

export interface PlaybookStep {
  name: string
  prompt: string             // handlebars template, {{task}} available
  checkpoint?: string        // description of what to verify before next step
  checkpointAuto?: boolean   // if true, agent self-validates; if false, pause for human
  timeoutMinutes?: number
}

export interface Playbook {
  name: string
  description: string
  agent: AgentTarget
  version: string            // semver
  contextStrategy: ContextStrategy
  steps: PlaybookStep[]
  tags?: string[]
  author?: string
}
```

### 1.3 — config types (`packages/shared/src/types/config.ts`)

```typescript
export type MemoryDepth = 'full' | 'summary' | 'none'

export interface TeamConfig {
  name: string
  playbooksRepo: string      // local path to cloned repo
  memoryRepo: string         // local path to cloned repo
  enabled: boolean
  memoryAccess: 'read-only' | 'read-write'
}

export interface ModuleConfig {
  path: string               // e.g. src/auth
  memoryDepth: MemoryDepth
  watchForHook: boolean      // whether post-commit hook prompts here
}

export interface EmbeddingsConfig {
  provider: 'anthropic' | 'local'
  localModel?: string        // e.g. nomic-embed-text (via ollama)
  apiKey?: string            // falls back to ANTHROPIC_API_KEY env var
}

export interface AgentKitConfig {
  globalEnabled: boolean
  defaultTeam?: string
  teams: Record<string, TeamConfig>
  modules: Record<string, ModuleConfig>
  embeddings: EmbeddingsConfig
  editor: string             // default: $EDITOR or 'vim'
  defaultAgent: string       // default: 'claude-code'
}
```

### 1.4 — shared utilities

Create `packages/shared/src/utils/tokens.ts`:
```typescript
// Token estimation without heavy deps — 4 chars ≈ 1 token
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function truncateToTokenBudget(text: string, budget: number): string {
  const charBudget = budget * 4
  if (text.length <= charBudget) return text
  return text.slice(0, charBudget) + '\n[truncated to fit token budget]'
}
```

Create `packages/shared/src/utils/hash.ts`:
```typescript
import { createHash } from 'crypto'

export function sha256Short(input: string, length = 12): string {
  return createHash('sha256').update(input).digest('hex').slice(0, length)
}
```

**Acceptance check:** `packages/shared` builds cleanly. All types export correctly. No logic errors.

---

## phase 2 — config system

**Task:** Build config loading, schema validation, and the SQLite client. These are the foundation everything else depends on.

### 2.1 — config schema (`packages/cli/src/config/schema.ts`)

Use zod to validate the TOML config file:

```typescript
import { z } from 'zod'

export const TeamConfigSchema = z.object({
  name: z.string(),
  playbooksRepo: z.string(),
  memoryRepo: z.string(),
  enabled: z.boolean().default(true),
  memoryAccess: z.enum(['read-only', 'read-write']).default('read-write'),
})

export const AgentKitConfigSchema = z.object({
  globalEnabled: z.boolean().default(true),
  defaultTeam: z.string().optional(),
  editor: z.string().default(process.env['EDITOR'] ?? 'vim'),
  defaultAgent: z.string().default('claude-code'),
  teams: z.record(TeamConfigSchema).default({}),
  modules: z.record(z.object({
    memoryDepth: z.enum(['full', 'summary', 'none']).default('full'),
    watchForHook: z.boolean().default(true),
  })).default({}),
  embeddings: z.object({
    provider: z.enum(['anthropic', 'local']).default('anthropic'),
    localModel: z.string().optional(),
  }).default({ provider: 'anthropic' }),
})

export type ValidatedConfig = z.infer<typeof AgentKitConfigSchema>
```

### 2.2 — config loader (`packages/cli/src/config/loader.ts`)

```typescript
import { homedir } from 'os'
import { join } from 'path'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import TOML from '@iarna/toml'
import { AgentKitConfigSchema, type ValidatedConfig } from './schema.js'

export const CONFIG_DIR = join(homedir(), '.agentkit')
export const CONFIG_PATH = join(CONFIG_DIR, 'config.toml')
export const DB_PATH = join(CONFIG_DIR, 'index.db')

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

export function loadConfig(): ValidatedConfig {
  ensureConfigDir()
  if (!existsSync(CONFIG_PATH)) {
    // Return defaults if no config exists yet
    return AgentKitConfigSchema.parse({})
  }
  const raw = readFileSync(CONFIG_PATH, 'utf-8')
  const parsed = TOML.parse(raw)
  return AgentKitConfigSchema.parse(parsed)
}

export function saveConfig(config: ValidatedConfig): void {
  ensureConfigDir()
  writeFileSync(CONFIG_PATH, TOML.stringify(config as TOML.JsonMap))
}

export function getTeamConfig(config: ValidatedConfig, teamName: string) {
  const team = config.teams[teamName]
  if (!team) throw new Error(`Team "${teamName}" not found in config. Run agentkit init --team ${teamName}`)
  return team
}
```

### 2.3 — SQLite client (`packages/cli/src/db/client.ts`)

```typescript
import Database from 'better-sqlite3'
import { DB_PATH } from '../config/loader.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  runMigrations(_db)
  return _db
}

function runMigrations(db: Database.Database): void {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const migration = readFileSync(join(__dirname, 'migrations/001_init.sql'), 'utf-8')
  db.exec(migration)
}
```

Create `packages/cli/src/db/migrations/001_init.sql`:
```sql
CREATE TABLE IF NOT EXISTS memory_index (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  developer TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',  -- JSON array
  bm25_tokens TEXT NOT NULL DEFAULT '[]',  -- JSON array
  decay_score REAL NOT NULL DEFAULT 1.0,
  embedding_path TEXT,  -- path to .bin file, nullable
  last_indexed TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memory_module ON memory_index(module);
CREATE INDEX IF NOT EXISTS idx_memory_date ON memory_index(date);

CREATE TABLE IF NOT EXISTS session_log (
  id TEXT PRIMARY KEY,
  team TEXT NOT NULL,
  started_at TEXT NOT NULL,
  agent TEXT NOT NULL,
  module TEXT,
  raw_log_path TEXT,
  distilled BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS toggle_state (
  scope TEXT PRIMARY KEY,  -- 'global', team name, or module path
  enabled BOOLEAN NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Acceptance check:** Config loads with defaults when no file exists. SQLite opens and runs migration without error. All tests pass.

---

## phase 3 — memory writer & reader

**Task:** Build the write path (creating memory entries) and read path (loading them from disk).

### 3.1 — memory writer (`packages/cli/src/core/memory/writer.ts`)

```typescript
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { sha256Short } from '@agentkit/shared'
import type { MemoryFrontmatter, MemoryEntry } from '@agentkit/shared'

export interface WriteMemoryOptions {
  memoryRepo: string
  frontmatter: Omit<MemoryFrontmatter, 'date' | 'developer'>
  content: Partial<Pick<MemoryEntry, 'decision' | 'reason' | 'rejected' | 'tradeoffAccepted' | 'open' | 'reusablePattern'>>
}

function getGitUser(): string {
  try {
    return execSync('git config user.name', { encoding: 'utf-8' }).trim()
  } catch {
    return process.env['USER'] ?? 'unknown'
  }
}

function getCurrentCommit(): string | undefined {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return undefined
  }
}

export function buildMemoryFilePath(memoryRepo: string, module: string, date: string, task: string): string {
  const monthDir = date.slice(0, 7) // YYYY-MM
  const slug = task.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  return join(memoryRepo, 'modules', module.replace(/\//g, '-'), monthDir, `${date}-${slug}.md`)
}

export function renderMemoryTemplate(templatePath: string, data: Record<string, string>): string {
  const source = readFileSync(templatePath, 'utf-8')
  const template = Handlebars.compile(source)
  return template(data)
}

export function writeMemoryEntry(options: WriteMemoryOptions): { filePath: string; entry: MemoryEntry } {
  const date = new Date().toISOString().slice(0, 10)
  const developer = getGitUser()
  const commit = getCurrentCommit()

  const frontmatter: MemoryFrontmatter = {
    date,
    developer,
    commit,
    ...options.frontmatter,
  }

  const id = sha256Short(`${date}:${frontmatter.module}:${developer}`)

  const sections: string[] = [
    `---`,
    `date: ${frontmatter.date}`,
    `module: ${frontmatter.module}`,
    `task: ${frontmatter.task}`,
    `developer: ${frontmatter.developer}`,
    `agent: ${frontmatter.agent}`,
    frontmatter.tokensUsed ? `tokens_used: ${frontmatter.tokensUsed}` : '',
    `tags: [${frontmatter.tags.join(', ')}]`,
    frontmatter.commit ? `commit: ${frontmatter.commit}` : '',
    `---`,
    '',
    options.content.decision ? `## decision\n${options.content.decision}` : '',
    options.content.reason ? `\n## reason\n${options.content.reason}` : '',
    options.content.rejected ? `\n## rejected\n${options.content.rejected}` : '',
    options.content.tradeoffAccepted ? `\n## tradeoff accepted\n${options.content.tradeoffAccepted}` : '',
    options.content.open ? `\n## open\n${options.content.open}` : '',
    options.content.reusablePattern ? `\n## reusable pattern\n${options.content.reusablePattern}` : '',
  ].filter(Boolean)

  const rawMarkdown = sections.join('\n')
  const filePath = buildMemoryFilePath(options.memoryRepo, frontmatter.module, date, frontmatter.task)

  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, rawMarkdown, 'utf-8')

  // Append to global index.jsonl
  const indexPath = join(options.memoryRepo, 'index.jsonl')
  const indexEntry = JSON.stringify({ id, filePath: filePath.replace(options.memoryRepo, ''), date, module: frontmatter.module, developer, tags: frontmatter.tags })
  const current = existsSync(indexPath) ? readFileSync(indexPath, 'utf-8') : ''
  writeFileSync(indexPath, current + indexEntry + '\n', 'utf-8')

  const entry: MemoryEntry = {
    id,
    frontmatter,
    rawMarkdown,
    filePath,
    decision: options.content.decision ?? '',
    reason: options.content.reason ?? '',
    rejected: options.content.rejected,
    tradeoffAccepted: options.content.tradeoffAccepted,
    open: options.content.open,
    reusablePattern: options.content.reusablePattern,
  }

  return { filePath, entry }
}
```

### 3.2 — memory reader (`packages/cli/src/core/memory/reader.ts`)

```typescript
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join, extname } from 'path'
import matter from 'gray-matter'
import { sha256Short, estimateTokens } from '@agentkit/shared'
import type { MemoryEntry, MemoryFrontmatter, IndexedMemory } from '@agentkit/shared'

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2)
}

function computeDecayScore(date: string, fileExists: boolean): number {
  if (!fileExists) return 0.1
  const ageMs = Date.now() - new Date(date).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  // Decay: 1.0 at 0 days, 0.5 at 180 days, 0.2 at 540 days
  const recency = Math.exp(-ageDays / 260)
  return Math.max(0.1, recency)
}

export function parseMemoryFile(filePath: string): MemoryEntry | null {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)

    const frontmatter = data as MemoryFrontmatter
    if (!frontmatter.date || !frontmatter.module) return null

    const sections: Record<string, string> = {}
    const sectionRegex = /^## (.+)\n([\s\S]*?)(?=^## |\z)/gm
    let match: RegExpExecArray | null
    while ((match = sectionRegex.exec(content)) !== null) {
      sections[match[1]!.trim()] = match[2]!.trim()
    }

    return {
      id: sha256Short(`${frontmatter.date}:${frontmatter.module}:${frontmatter.developer}`),
      frontmatter,
      rawMarkdown: raw,
      filePath,
      decision: sections['decision'] ?? '',
      reason: sections['reason'] ?? '',
      rejected: sections['rejected'],
      tradeoffAccepted: sections['tradeoff accepted'],
      open: sections['open'],
      reusablePattern: sections['reusable pattern'],
    }
  } catch {
    return null
  }
}

export function loadAllMemories(memoryRepo: string): IndexedMemory[] {
  const modulesDir = join(memoryRepo, 'modules')
  if (!existsSync(modulesDir)) return []

  const results: IndexedMemory[] = []

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (extname(entry.name) === '.md') {
        const mem = parseMemoryFile(fullPath)
        if (!mem) continue

        const indexed: IndexedMemory = {
          ...mem,
          bm25Tokens: tokenize(`${mem.decision} ${mem.reason} ${mem.frontmatter.tags.join(' ')}`),
          decayScore: computeDecayScore(mem.frontmatter.date, existsSync(fullPath)),
        }
        results.push(indexed)
      }
    }
  }

  walk(modulesDir)
  return results
}
```

**Acceptance check:** Write a memory entry, read it back, fields match. Tokenization produces correct arrays. Decay score is 1.0 for today's date.

---

## phase 4 — search (BM25 + semantic rerank)

**Task:** Build the two-pass search pipeline. BM25 is pure local. Semantic uses pre-built embeddings from the repo.

### 4.1 — BM25 (`packages/cli/src/core/optimizer/bm25.ts`)

```typescript
import type { IndexedMemory } from '@agentkit/shared'

interface BM25Params {
  k1: number  // term frequency saturation — default 1.5
  b: number   // field length normalization — default 0.75
}

interface CorpusStats {
  avgFieldLength: number
  docFrequencies: Map<string, number>
  totalDocs: number
}

function buildCorpusStats(memories: IndexedMemory[]): CorpusStats {
  const docFrequencies = new Map<string, number>()
  let totalLength = 0

  for (const mem of memories) {
    totalLength += mem.bm25Tokens.length
    const unique = new Set(mem.bm25Tokens)
    for (const token of unique) {
      docFrequencies.set(token, (docFrequencies.get(token) ?? 0) + 1)
    }
  }

  return {
    avgFieldLength: totalLength / Math.max(memories.length, 1),
    docFrequencies,
    totalDocs: memories.length,
  }
}

function bm25Score(
  queryTokens: string[],
  docTokens: string[],
  stats: CorpusStats,
  params: BM25Params = { k1: 1.5, b: 0.75 }
): number {
  let score = 0
  const docLength = docTokens.length
  const termFreqs = new Map<string, number>()
  for (const t of docTokens) termFreqs.set(t, (termFreqs.get(t) ?? 0) + 1)

  for (const term of queryTokens) {
    const tf = termFreqs.get(term) ?? 0
    if (tf === 0) continue
    const df = stats.docFrequencies.get(term) ?? 0
    const idf = Math.log((stats.totalDocs - df + 0.5) / (df + 0.5) + 1)
    const normalizedTf = (tf * (params.k1 + 1)) / (tf + params.k1 * (1 - params.b + params.b * (docLength / stats.avgFieldLength)))
    score += idf * normalizedTf
  }

  return score
}

function tokenize(query: string): string[] {
  return query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2)
}

export function bm25Filter(query: string, memories: IndexedMemory[], topN = 20): IndexedMemory[] {
  if (memories.length === 0) return []
  const queryTokens = tokenize(query)
  const stats = buildCorpusStats(memories)

  return memories
    .map(mem => ({
      mem,
      score: bm25Score(queryTokens, mem.bm25Tokens, stats) * mem.decayScore,
    }))
    .filter(({ score }) => score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ mem }) => mem)
}
```

### 4.2 — embeddings (`packages/cli/src/core/optimizer/embeddings.ts`)

```typescript
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import type { IndexedMemory } from '@agentkit/shared'

// In-process embedding cache — keyed by content hash
const embeddingCache = new Map<string, Float32Array>()

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0)
    magA += (a[i] ?? 0) ** 2
    magB += (b[i] ?? 0) ** 2
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8)
}

export function loadEmbeddingFromRepo(memoryRepo: string, module: string): Float32Array | null {
  const binPath = join(memoryRepo, 'embeddings', `${module.replace(/\//g, '-')}.bin`)
  if (!existsSync(binPath)) return null
  const buffer = readFileSync(binPath)
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4)
}

export async function getQueryEmbedding(
  query: string,
  apiKey: string,
  provider: 'anthropic' | 'local' = 'anthropic'
): Promise<Float32Array> {
  const hash = createHash('sha256').update(query).digest('hex')
  if (embeddingCache.has(hash)) return embeddingCache.get(hash)!

  let vec: Float32Array

  if (provider === 'anthropic') {
    // Anthropic voyage embedding via messages API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 64,
        system: 'Return only a JSON array of 256 floats representing the embedding of the user text. No other output.',
        messages: [{ role: 'user', content: query }],
      }),
    })
    const data = await response.json() as { content: Array<{ text: string }> }
    const arr = JSON.parse(data.content[0]?.text ?? '[]') as number[]
    vec = new Float32Array(arr)
  } else {
    // Ollama local embedding
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', prompt: query }),
    })
    const data = await response.json() as { embedding: number[] }
    vec = new Float32Array(data.embedding)
  }

  embeddingCache.set(hash, vec)
  return vec
}

export function semanticRerank(
  queryEmbedding: Float32Array,
  candidates: IndexedMemory[],
  topN = 5
): IndexedMemory[] {
  return candidates
    .map(mem => ({
      mem,
      score: mem.embedding
        ? cosineSimilarity(queryEmbedding, mem.embedding) * mem.decayScore
        : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ mem }) => mem)
}
```

### 4.3 — token budget (`packages/cli/src/core/optimizer/budget.ts`)

```typescript
import { estimateTokens, truncateToTokenBudget } from '@agentkit/shared'
import type { IndexedMemory, MemoryIntent } from '@agentkit/shared'

const BUDGETS: Record<MemoryIntent, number> = {
  understand: 800,
  extend: 1200,
  debug: 600,
  review: 400,
}

function formatMemoryFull(mem: IndexedMemory): string {
  const lines = [
    `[${mem.frontmatter.date}] ${mem.frontmatter.developer} — ${mem.frontmatter.module}`,
    `DECISION: ${mem.decision}`,
    mem.reason ? `REASON: ${mem.reason}` : '',
    mem.rejected ? `REJECTED: ${mem.rejected}` : '',
    mem.tradeoffAccepted ? `TRADEOFF: ${mem.tradeoffAccepted}` : '',
    mem.open ? `OPEN: ${mem.open}` : '',
    mem.reusablePattern ? `PATTERN: ${mem.reusablePattern}` : '',
  ].filter(Boolean)
  return lines.join('\n')
}

function formatMemorySummary(mem: IndexedMemory): string {
  return `[${mem.frontmatter.date}] ${mem.frontmatter.module}: ${mem.decision.slice(0, 80)}...`
}

export function applyTokenBudget(memories: IndexedMemory[], intent: MemoryIntent): string {
  const budget = BUDGETS[intent]
  const header = `AGENTKIT TEAM MEMORY (intent: ${intent}, budget: ${budget} tokens)\n${'─'.repeat(50)}\n`
  let body = ''
  let used = estimateTokens(header)

  for (const mem of memories) {
    const full = formatMemoryFull(mem)
    const fullTokens = estimateTokens(full)

    if (used + fullTokens <= budget) {
      body += full + '\n\n'
      used += fullTokens
    } else {
      const summary = formatMemorySummary(mem)
      if (used + estimateTokens(summary) <= budget) {
        body += summary + '\n'
        used += estimateTokens(summary)
      }
    }
  }

  return header + (body || 'No relevant team memory found for this query.')
}
```

### 4.4 — unified search (`packages/cli/src/core/memory/search.ts`)

```typescript
import { loadAllMemories } from './reader.js'
import { bm25Filter } from '../optimizer/bm25.js'
import { getQueryEmbedding, semanticRerank } from '../optimizer/embeddings.js'
import { applyTokenBudget } from '../optimizer/budget.js'
import type { MemoryIntent } from '@agentkit/shared'

export interface SearchOptions {
  memoryRepo: string
  query: string
  module?: string
  intent?: MemoryIntent
  apiKey?: string
  embeddingProvider?: 'anthropic' | 'local'
}

export async function searchMemory(options: SearchOptions): Promise<string> {
  const { memoryRepo, query, module, intent = 'understand', apiKey, embeddingProvider = 'anthropic' } = options

  // Load all memories (from SQLite index if warm, from disk if cold)
  let memories = loadAllMemories(memoryRepo)

  // Filter by module if specified
  if (module) {
    memories = memories.filter(m =>
      m.frontmatter.module === module ||
      m.frontmatter.module.startsWith(module)
    )
  }

  // Gate 1: BM25 keyword filter — pure local, zero API calls
  const candidates = bm25Filter(query, memories, 20)
  if (candidates.length === 0) {
    return 'No relevant team memory found for this query.'
  }

  // Gate 2: semantic rerank — uses pre-built embeddings from repo
  let reranked = candidates
  if (apiKey && candidates.some(c => c.embedding)) {
    try {
      const queryVec = await getQueryEmbedding(query, apiKey, embeddingProvider)
      reranked = semanticRerank(queryVec, candidates, 5)
    } catch {
      // Fall back to BM25 order if embedding fails
      reranked = candidates.slice(0, 5)
    }
  } else {
    reranked = candidates.slice(0, 5)
  }

  // Gate 3: apply token budget
  return applyTokenBudget(reranked, intent)
}
```

**Acceptance check:** With 10 sample memory entries, BM25 returns relevant results for keyword queries. Budget cap produces output within ~10% of target token count.

---

## phase 5 — playbook engine

**Task:** Build the playbook parser, context strategy builder, and step executor.

### 5.1 — parser (`packages/cli/src/core/playbook/parser.ts`)

```typescript
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { load as yamlLoad } from 'js-yaml'
import { z } from 'zod'
import type { Playbook } from '@agentkit/shared'

const PlaybookSchema = z.object({
  name: z.string(),
  description: z.string(),
  agent: z.enum(['claude-code', 'codex', 'cursor', 'any']).default('claude-code'),
  version: z.string().default('1.0.0'),
  contextStrategy: z.object({
    include: z.array(z.string()).default([]),
    exclude: z.array(z.string()).default(['node_modules/**', 'dist/**', '.git/**']),
    summarize: z.array(z.string()).default([]),
    maxTokens: z.number().default(80000),
    priorityFiles: z.array(z.string()).default([]),
  }).default({}),
  steps: z.array(z.object({
    name: z.string(),
    prompt: z.string(),
    checkpoint: z.string().optional(),
    checkpointAuto: z.boolean().default(false),
    timeoutMinutes: z.number().default(30),
  })),
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),
})

export function loadPlaybook(playbooksRepo: string, name: string): Playbook {
  const candidates = [
    join(playbooksRepo, 'playbooks', `${name}.yml`),
    join(playbooksRepo, 'playbooks', `${name}.yaml`),
    join(playbooksRepo, `${name}.yml`),
  ]

  for (const path of candidates) {
    if (existsSync(path)) {
      const raw = readFileSync(path, 'utf-8')
      const parsed = yamlLoad(raw)
      return PlaybookSchema.parse(parsed) as Playbook
    }
  }

  throw new Error(`Playbook "${name}" not found in ${join(playbooksRepo, 'playbooks')}/`)
}

export function listPlaybooks(playbooksRepo: string): Array<{ name: string; description: string; agent: string }> {
  const { readdirSync } = await import('fs')
  const dir = join(playbooksRepo, 'playbooks')
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map(f => {
      try {
        const pb = loadPlaybook(playbooksRepo, f.replace(/\.ya?ml$/, ''))
        return { name: pb.name, description: pb.description, agent: pb.agent }
      } catch {
        return null
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
}
```

### 5.2 — executor (`packages/cli/src/core/playbook/executor.ts`)

```typescript
import Handlebars from 'handlebars'
import { execa } from 'execa'
import type { Playbook, PlaybookStep } from '@agentkit/shared'
import type { ValidatedConfig } from '../../config/schema.js'

export interface ExecutionContext {
  task: string
  specPath: string
  workingDir: string
  config: ValidatedConfig
  teamName: string
}

export interface StepResult {
  stepName: string
  success: boolean
  output?: string
  error?: string
  tokensUsed?: number
}

function renderPrompt(template: string, context: ExecutionContext): string {
  const hbs = Handlebars.compile(template)
  return hbs({
    task: context.task,
    specPath: context.specPath,
    cwd: context.workingDir,
  })
}

async function executeClaudeCode(prompt: string, cwd: string): Promise<{ output: string; tokensUsed: number }> {
  // Claude Code CLI: `claude -p "prompt"` executes non-interactively
  const { stdout } = await execa('claude', ['-p', prompt], { cwd, timeout: 30 * 60 * 1000 })
  return { output: stdout, tokensUsed: 0 } // token count from stdout parsing if available
}

async function executeCodex(prompt: string, cwd: string): Promise<{ output: string; tokensUsed: number }> {
  const { stdout } = await execa('codex', ['--full-auto', '-q', prompt], { cwd, timeout: 30 * 60 * 1000 })
  return { output: stdout, tokensUsed: 0 }
}

export async function executeStep(
  step: PlaybookStep,
  context: ExecutionContext
): Promise<StepResult> {
  const prompt = renderPrompt(step.prompt, context)
  const agent = context.config.defaultAgent

  try {
    let result: { output: string; tokensUsed: number }

    if (agent === 'claude-code') {
      result = await executeClaudeCode(prompt, context.workingDir)
    } else if (agent === 'codex') {
      result = await executeCodex(prompt, context.workingDir)
    } else {
      throw new Error(`Unknown agent: ${agent}. Supported: claude-code, codex`)
    }

    return { stepName: step.name, success: true, output: result.output, tokensUsed: result.tokensUsed }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { stepName: step.name, success: false, error }
  }
}

export async function executePlaybook(
  playbook: Playbook,
  context: ExecutionContext,
  onStepComplete: (result: StepResult) => void
): Promise<StepResult[]> {
  const results: StepResult[] = []

  for (const step of playbook.steps) {
    const result = await executeStep(step, context)
    results.push(result)
    onStepComplete(result)

    if (!result.success) break
    // If checkpoint is manual (checkpointAuto: false), pause for human confirmation
    // This is handled in the command layer, not here
  }

  return results
}
```

**Acceptance check:** Parse all three starter playbooks without errors. Rendered prompts contain correct `{{task}}` substitution.

---

## phase 6 — CLI commands

**Task:** Wire all core modules to commander subcommands. Each command is a thin orchestration layer — no business logic here.

### 6.1 — CLI entrypoint (`packages/cli/src/index.ts`)

```typescript
import { Command } from 'commander'
import { registerInit } from './commands/init.js'
import { registerRun } from './commands/run.js'
import { registerSpec } from './commands/spec.js'
import { registerLog } from './commands/log.js'
import { registerDigest } from './commands/digest.js'
import { registerSync } from './commands/sync.js'
import { registerToggle } from './commands/toggle.js'
import { registerMemory } from './commands/memory.js'

const program = new Command()

program
  .name('agentkit')
  .description('git-native institutional memory for AI-assisted development teams')
  .version('0.1.0')

registerInit(program)
registerRun(program)
registerSpec(program)
registerLog(program)
registerDigest(program)
registerSync(program)
registerToggle(program)
registerMemory(program)

program.parse()
```

### 6.2 — init command (`packages/cli/src/commands/init.ts`)

```typescript
import { Command } from 'commander'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import chalk from 'chalk'
import ora from 'ora'
import { loadConfig, saveConfig, CONFIG_DIR } from '../config/loader.js'

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('initialize agentkit for a team')
    .requiredOption('--team <name>', 'team name (e.g. acme)')
    .option('--playbooks-repo <url>', 'git URL of playbooks repo')
    .option('--memory-repo <url>', 'git URL of memory repo')
    .option('--local', 'create local repos instead of cloning')
    .action(async (opts) => {
      const spinner = ora('Initializing agentkit...').start()

      try {
        const config = loadConfig()
        const teamDir = join(homedir(), '.agentkit', 'repos', opts.team)
        mkdirSync(teamDir, { recursive: true })

        const playbooksPath = join(teamDir, 'playbooks')
        const memoryPath = join(teamDir, 'memory')

        if (opts.local) {
          // Init empty git repos locally
          if (!existsSync(playbooksPath)) {
            execSync(`git init ${playbooksPath}`)
            // Copy starter templates
            spinner.text = 'Creating starter playbooks...'
            // (template copy logic here)
          }
          if (!existsSync(memoryPath)) {
            execSync(`git init ${memoryPath}`)
          }
        } else {
          if (opts.playbooksRepo && !existsSync(playbooksPath)) {
            spinner.text = 'Cloning playbooks repo...'
            execSync(`git clone ${opts.playbooksRepo} ${playbooksPath}`)
          }
          if (opts.memoryRepo && !existsSync(memoryPath)) {
            spinner.text = 'Cloning memory repo...'
            execSync(`git clone ${opts.memoryRepo} ${memoryPath}`)
          }
        }

        // Update config
        config.teams[opts.team] = {
          name: opts.team,
          playbooksRepo: playbooksPath,
          memoryRepo: memoryPath,
          enabled: true,
          memoryAccess: 'read-write',
        }
        if (!config.defaultTeam) config.defaultTeam = opts.team
        saveConfig(config)

        // Install git hook in current repo if inside one
        try {
          const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()
          const hookPath = join(gitRoot, '.git', 'hooks', 'post-commit')
          const hookContent = `#!/bin/sh\nagentkit _hook post-commit --team ${opts.team}\n`
          writeFileSync(hookPath, hookContent, { mode: 0o755 })
        } catch {
          // Not in a git repo — skip hook
        }

        spinner.succeed(chalk.green(`agentkit initialized for team "${opts.team}"`))
        console.log(chalk.dim(`  playbooks: ${playbooksPath}`))
        console.log(chalk.dim(`  memory:    ${memoryPath}`))
        console.log(chalk.dim(`  config:    ${CONFIG_DIR}/config.toml`))
        console.log('')
        console.log(`Next: ${chalk.cyan('agentkit run api-feature --task "your task here"')}`)
      } catch (err) {
        spinner.fail(chalk.red('Init failed'))
        console.error(err instanceof Error ? err.message : err)
        process.exit(1)
      }
    })
}
```

### 6.3 — run command (`packages/cli/src/commands/run.ts`)

```typescript
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { loadConfig, getTeamConfig } from '../config/loader.js'
import { loadPlaybook } from '../core/playbook/parser.js'
import { executePlaybook, type ExecutionContext } from '../core/playbook/executor.js'
import { searchMemory } from '../core/memory/search.js'

export function registerRun(program: Command): void {
  program
    .command('run <playbook>')
    .description('execute a playbook with an AI agent')
    .requiredOption('--task <description>', 'what to build')
    .option('--team <name>', 'which team config to use')
    .option('--dry-run', 'show context without invoking agent')
    .option('--agent <name>', 'override agent (claude-code, codex)')
    .action(async (playbookName: string, opts) => {
      const config = loadConfig()
      const teamName = opts.team ?? config.defaultTeam
      if (!teamName) {
        console.error(chalk.red('No team specified. Run agentkit init --team <name> first.'))
        process.exit(1)
      }

      const team = getTeamConfig(config, teamName)
      const playbook = loadPlaybook(team.playbooksRepo, playbookName)

      // Pre-flight: load relevant memory context
      const spinner = ora('Loading team memory context...').start()
      const memoryContext = await searchMemory({
        memoryRepo: team.memoryRepo,
        query: opts.task,
        intent: 'extend',
        apiKey: process.env['ANTHROPIC_API_KEY'],
      })
      spinner.stop()

      if (opts.dryRun) {
        console.log(chalk.bold('\nDRY RUN — context that would be injected:\n'))
        console.log(memoryContext)
        console.log(chalk.bold('\nPlaybook steps:'))
        for (const step of playbook.steps) {
          console.log(chalk.cyan(`  • ${step.name}`))
          console.log(chalk.dim(`    checkpoint: ${step.checkpoint ?? 'none'}`))
        }
        return
      }

      const context: ExecutionContext = {
        task: opts.task,
        specPath: 'spec.md',
        workingDir: process.cwd(),
        config: { ...config, defaultAgent: opts.agent ?? config.defaultAgent },
        teamName,
      }

      console.log(chalk.bold(`\nRunning playbook: ${playbook.name}`))
      console.log(chalk.dim(`Task: ${opts.task}\n`))

      const results = await executePlaybook(playbook, context, (result) => {
        if (result.success) {
          console.log(chalk.green(`  ✓ ${result.stepName}`))
        } else {
          console.log(chalk.red(`  ✗ ${result.stepName}: ${result.error}`))
        }
      })

      const failed = results.filter(r => !r.success)
      if (failed.length === 0) {
        console.log(chalk.green('\n✓ Playbook complete'))
        console.log(chalk.dim('Run agentkit log to capture what you learned.'))
      } else {
        console.log(chalk.red(`\n✗ Playbook failed at step: ${failed[0]?.stepName}`))
        process.exit(1)
      }
    })
}
```

### 6.4 — log command (`packages/cli/src/commands/log.ts`)

```typescript
import { Command } from 'commander'
import { execSync, spawnSync } from 'child_process'
import { writeFileSync, unlinkSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import chalk from 'chalk'
import { loadConfig, getTeamConfig } from '../config/loader.js'
import { writeMemoryEntry } from '../core/memory/writer.js'

const TEMPLATE = `---
module: FILL_IN  (e.g. src/auth)
task: FILL_IN
agent: claude-code
tags: []
---

## decision
What did you decide to do?

## reason
Why? What drove this decision?

## rejected
(optional) What alternatives did you consider and reject?

## tradeoff accepted
(optional) What downside are you accepting?

## open
(optional) What is still unresolved or deferred?

## reusable pattern
(optional) A prompt snippet or approach others can reuse.
`

export function registerLog(program: Command): void {
  program
    .command('log')
    .description('record a decision or learning to team memory')
    .option('--team <name>', 'which team')
    .option('--module <path>', 'module path (e.g. src/auth)')
    .option('--auto', 'auto-commit without opening editor (for git hooks)')
    .action(async (opts) => {
      const config = loadConfig()
      const teamName = opts.team ?? config.defaultTeam
      if (!teamName) { console.error('No team configured.'); process.exit(1) }
      const team = getTeamConfig(config, teamName)

      const tmpPath = join(tmpdir(), `agentkit-log-${Date.now()}.md`)
      writeFileSync(tmpPath, TEMPLATE)

      const editor = config.editor ?? process.env['EDITOR'] ?? 'vim'
      const { status } = spawnSync(editor, [tmpPath], { stdio: 'inherit' })
      if (status !== 0) { unlinkSync(tmpPath); process.exit(1) }

      const edited = readFileSync(tmpPath, 'utf-8')
      unlinkSync(tmpPath)

      if (edited === TEMPLATE) {
        console.log(chalk.yellow('No changes made. Log cancelled.'))
        return
      }

      // Parse the edited file (reuse memory reader)
      // Quick parse for module + task from frontmatter
      const moduleMatch = edited.match(/^module:\s*(.+)$/m)
      const taskMatch = edited.match(/^task:\s*(.+)$/m)
      const agentMatch = edited.match(/^agent:\s*(.+)$/m)
      const tagsMatch = edited.match(/^tags:\s*\[([^\]]*)\]/m)

      const module = moduleMatch?.[1]?.trim().replace('FILL_IN', 'global') ?? 'global'
      const task = taskMatch?.[1]?.trim().replace('FILL_IN', 'untitled') ?? 'untitled'
      const agent = (agentMatch?.[1]?.trim() ?? 'claude-code') as 'claude-code' | 'codex'
      const tags = (tagsMatch?.[1] ?? '').split(',').map(t => t.trim()).filter(Boolean)

      const decisionMatch = edited.match(/^## decision\n([\s\S]*?)(?=^## |\z)/m)
      const reasonMatch = edited.match(/^## reason\n([\s\S]*?)(?=^## |\z)/m)

      const { filePath } = writeMemoryEntry({
        memoryRepo: team.memoryRepo,
        frontmatter: { module: opts.module ?? module, task, agent, tags },
        content: {
          decision: decisionMatch?.[1]?.trim() ?? '',
          reason: reasonMatch?.[1]?.trim() ?? '',
        },
      })

      // Auto-commit to memory repo
      execSync(`git -C ${team.memoryRepo} add -A && git -C ${team.memoryRepo} commit -m "log: ${task} (${module})"`)

      console.log(chalk.green('✓ Memory logged and committed'))
      console.log(chalk.dim(`  ${filePath}`))
    })
}
```

### 6.5 — remaining commands (stubs to implement)

Implement each of these following the same pattern as above — thin orchestration, delegate to core modules:

**`commands/spec.ts`** — `agentkit spec "<task>"`: loads the spec template from the playbooks repo, renders it with handlebars, writes `spec.md` to cwd, opens in `$EDITOR`.

**`commands/digest.ts`** — `agentkit digest`: finds the most recent agent session log (`~/.claude/conversations/` for Claude Code, `~/.codex/sessions/` for Codex), calls Anthropic API with a distillation prompt, writes extracted decisions to a temp file, opens in `$EDITOR` for review, calls `writeMemoryEntry` on save.

**`commands/sync.ts`** — `agentkit sync`: runs `git pull` on both repos for the specified team, then calls `loadAllMemories()` to rebuild the SQLite index, logs stats (entries added/changed).

**`commands/toggle.ts`** — `agentkit toggle <on|off> [scope]`: reads/writes the `toggle_state` SQLite table. Scopes: `global`, team name, or module path.

**`commands/memory.ts`** — `agentkit memory search "<query>"`: calls `searchMemory()` and prints formatted results to stdout. Also `agentkit memory list` to show all modules with entry counts.

**`commands/learn.ts`** — `agentkit learn`: interactive CLI walkthrough using `inquirer`. Shows team playbooks, lets user step through a real playbook's steps with example prompts, shows recent memory entries for context.

**Acceptance check:** `agentkit --help` lists all commands. `agentkit init --local --team test` runs without error. `agentkit log` opens editor, writes file to correct path, commits to git.

---

## phase 7 — MCP server

**Task:** Build the MCP server that agents call. It shares the same core modules as the CLI.

### 7.1 — server (`packages/mcp/src/server.ts`)

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { loadConfig, getTeamConfig } from '../../cli/src/config/loader.js'
import { searchMemory } from '../../cli/src/core/memory/search.js'
import { writeMemoryEntry } from '../../cli/src/core/memory/writer.js'
import { SessionCache } from './cache/session.js'

// Note: In the published package, import from @agentkit/cli, not relative path
// This structure is for monorepo development

const server = new Server(
  { name: 'agentkit', version: '0.1.0' },
  { capabilities: { tools: {} } }
)

const sessionCache = new SessionCache()

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'agentkit_query',
      description: [
        'Query your team\'s institutional memory — decisions, patterns, and reasoning behind the codebase.',
        'Use when you need to understand WHY something was built a certain way, what was tried and rejected,',
        'who to contact, or how to add features consistently with existing team patterns.',
        'Always call this before making architectural decisions or modifying unfamiliar modules.',
      ].join(' '),
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Natural language question about the codebase or a decision' },
          module: { type: 'string', description: 'Specific module/path to focus on (e.g. src/auth). Optional.' },
          intent: {
            type: 'string',
            enum: ['understand', 'extend', 'debug', 'review'],
            description: 'understand=explain decision, extend=add feature, debug=find cause, review=check patterns',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'agentkit_log',
      description: 'Log a significant decision or pattern to team memory. Call this when you make an architectural choice, reject an approach, or discover something the team should know.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          decision: { type: 'string', description: 'What was decided or implemented' },
          reason: { type: 'string', description: 'Why this approach was chosen' },
          module: { type: 'string', description: 'Which module this applies to' },
          rejected: { type: 'string', description: 'What alternatives were rejected and why' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Relevant tags' },
        },
        required: ['decision', 'reason'],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const config = loadConfig()
  const teamName = process.env['AGENTKIT_TEAM'] ?? config.defaultTeam
  if (!teamName) {
    return { content: [{ type: 'text', text: 'agentkit: no team configured. Run agentkit init first.' }] }
  }

  // Check global toggle
  if (!config.globalEnabled) {
    return { content: [{ type: 'text', text: '' }] } // silent when disabled
  }

  const team = getTeamConfig(config, teamName)

  if (request.params.name === 'agentkit_query') {
    const { query, module, intent = 'understand' } = request.params.arguments as {
      query: string
      module?: string
      intent?: 'understand' | 'extend' | 'debug' | 'review'
    }

    // Check session cache first — same module+intent costs zero tokens
    const cacheKey = `${module ?? 'global'}:${intent}`
    const cached = sessionCache.get(cacheKey)
    if (cached) {
      return { content: [{ type: 'text', text: cached }] }
    }

    const result = await searchMemory({
      memoryRepo: team.memoryRepo,
      query,
      module,
      intent,
      apiKey: process.env['ANTHROPIC_API_KEY'],
    })

    sessionCache.set(cacheKey, result)
    return { content: [{ type: 'text', text: result }] }
  }

  if (request.params.name === 'agentkit_log') {
    const args = request.params.arguments as {
      decision: string
      reason: string
      module?: string
      rejected?: string
      tags?: string[]
    }

    const { filePath } = writeMemoryEntry({
      memoryRepo: team.memoryRepo,
      frontmatter: {
        module: args.module ?? 'global',
        task: args.decision.slice(0, 60),
        agent: 'claude-code',
        tags: args.tags ?? [],
      },
      content: {
        decision: args.decision,
        reason: args.reason,
        rejected: args.rejected,
      },
    })

    return { content: [{ type: 'text', text: `Memory logged: ${filePath}` }] }
  }

  return { content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }] }
})

const transport = new StdioServerTransport()
await server.connect(transport)
```

### 7.2 — session cache (`packages/mcp/src/cache/session.ts`)

```typescript
export class SessionCache {
  private cache = new Map<string, { result: string; hits: number; cachedAt: number }>()
  private readonly ttlMs = 30 * 60 * 1000 // 30 min session TTL

  get(key: string): string | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.cache.delete(key)
      return null
    }
    entry.hits++
    return entry.result
  }

  set(key: string, result: string): void {
    this.cache.set(key, { result, hits: 0, cachedAt: Date.now() })
  }

  stats(): { entries: number; totalHits: number } {
    let totalHits = 0
    for (const entry of this.cache.values()) totalHits += entry.hits
    return { entries: this.cache.size, totalHits }
  }
}
```

**Acceptance check:** MCP server starts and responds to `tools/list`. Calling `agentkit_query` returns formatted memory context. Second call with same key returns cached result (verify with debug log showing cache hit).

---

## phase 8 — starter playbooks & templates

**Task:** Create real, usable starter content. These ship in the `templates/` directory and get copied on `agentkit init --local`.

### 8.1 — api-feature playbook (`templates/playbooks-repo/playbooks/api-feature.yml`)

```yaml
name: api-feature
description: Build a new REST endpoint end-to-end with spec, implementation, and tests
agent: claude-code
version: 1.0.0

contextStrategy:
  include:
    - src/routes/
    - src/middleware/
    - src/types/
    - tests/integration/
  exclude:
    - node_modules/
    - dist/
    - coverage/
  summarize:
    - docs/
  maxTokens: 80000
  priorityFiles:
    - src/types/index.ts
    - src/app.ts

steps:
  - name: write-spec
    prompt: |
      Team context from agentkit memory has been injected above.

      Task: {{task}}

      Write a spec for this feature as spec.md in the project root.
      The spec must include:
      - Input/output contract (request shape, response shape, status codes)
      - Error cases and how each is handled
      - Data model changes required (if any)
      - Test plan (what integration tests will verify this)
      - Dependencies on existing modules (check team memory for relevant patterns)

      Do not write any implementation code yet. Only spec.md.
    checkpoint: spec.md exists in project root and contains all five sections
    checkpointAuto: false

  - name: implement
    prompt: |
      Implement the feature described in spec.md.
      Follow existing patterns in src/routes/ exactly.
      Write tests alongside the implementation (not after).
      Check team memory for any constraints on this module before writing code.
    checkpoint: implementation files exist and tests are written
    checkpointAuto: false

  - name: self-review
    prompt: |
      Review your own implementation against spec.md.
      For each requirement in the spec, confirm it is met.
      List any gaps. Fix them before declaring complete.
      Run the tests and confirm they pass.
    checkpoint: all tests pass, no spec gaps
    checkpointAuto: true

  - name: log-learning
    prompt: |
      Write a brief summary of what you implemented, any decisions you made
      that deviate from or extend the team's existing patterns, and anything
      future developers should know about this endpoint.
      Output as JSON: { decision, reason, patterns_used, open_questions }
    checkpointAuto: true
```

### 8.2 — memory entry template (`templates/playbooks-repo/templates/memory-entry.md.hbs`)

```handlebars
---
module: {{module}}
task: {{task}}
agent: {{agent}}
tags: []
---

## decision
<!-- What did you decide to do? Be specific. -->

## reason
<!-- Why this approach? What drove the decision? -->

## rejected
<!-- What alternatives did you consider? Why did you reject them? -->

## tradeoff accepted
<!-- What downside are you knowingly accepting? -->

## open
<!-- What is still unresolved? What should the next person decide? -->

## reusable pattern
<!-- A prompt, approach, or principle others can use directly. -->
```

### 8.3 — spec template (`templates/playbooks-repo/templates/spec.md.hbs`)

```handlebars
# spec: {{task}}

**date:** {{date}}
**author:** {{developer}}
**module:** {{module}}

---

## 1. what we're building
<!-- One paragraph description -->

## 2. input / output contract

### request
```
METHOD /path
Content-Type: application/json

{
  "field": "type — description"
}
```

### response (success)
```
200 OK
{
  "field": "type"
}
```

### response (errors)
| Status | Condition |
|--------|-----------|
| 400    | Invalid input |
| 401    | Unauthenticated |
| 404    | Resource not found |

## 3. data model changes
<!-- Tables added/modified, migrations required. "None" if no DB changes. -->

## 4. test plan
- [ ] Happy path: ...
- [ ] Error case: ...
- [ ] Edge case: ...

## 5. dependencies & constraints
<!-- Which existing modules does this touch? Any team constraints from memory? -->
```

---

## phase 9 — MCP registration file

**Task:** Create the config snippet that gets committed to user repos so every developer gets agentkit automatically.

### 9.1 — `.claude/settings.json` (committed to user's app repo)

Document this in `docs/mcp-integration.md`. The file to commit:

```json
{
  "mcpServers": {
    "agentkit": {
      "command": "npx",
      "args": ["@agentkit/mcp", "--team", "YOUR_TEAM_NAME"],
      "env": {}
    }
  }
}
```

For Codex, `codex.config.json`:
```json
{
  "mcp": {
    "servers": [
      {
        "name": "agentkit",
        "transport": "stdio",
        "command": "npx @agentkit/mcp --team YOUR_TEAM_NAME"
      }
    ]
  }
}
```

---

## phase 10 — testing

**Task:** Write tests for every core module. Use vitest. No mocks for file system — use real temp directories.

### test structure

```
packages/cli/src/
  core/
    memory/
      writer.test.ts      # write, read back, fields match
      reader.test.ts      # parse real .md files
      search.test.ts      # BM25 returns relevant results
    optimizer/
      bm25.test.ts        # score ordering, edge cases
      budget.test.ts      # output within token limit
    playbook/
      parser.test.ts      # parse valid/invalid YAML
  config/
    loader.test.ts        # load defaults, load from file, save
```

### sample test (`core/memory/writer.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeMemoryEntry } from './writer.js'
import { parseMemoryFile } from './reader.js'

describe('memory writer', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'agentkit-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true })
  })

  it('writes a memory entry and can be read back', () => {
    const { filePath, entry } = writeMemoryEntry({
      memoryRepo: tempDir,
      frontmatter: {
        module: 'src/auth',
        task: 'switch to jwt',
        agent: 'claude-code',
        tags: ['auth', 'jwt'],
      },
      content: {
        decision: 'Switched from express-session to stateless JWT',
        reason: 'Redis bottleneck at scale',
        rejected: 'express-session + Redis',
      },
    })

    const read = parseMemoryFile(filePath)
    expect(read).not.toBeNull()
    expect(read!.decision).toBe('Switched from express-session to stateless JWT')
    expect(read!.reason).toBe('Redis bottleneck at scale')
    expect(read!.rejected).toBe('express-session + Redis')
    expect(read!.frontmatter.module).toBe('src/auth')
    expect(read!.frontmatter.tags).toEqual(['auth', 'jwt'])
  })

  it('appends to index.jsonl', () => {
    writeMemoryEntry({ memoryRepo: tempDir, frontmatter: { module: 'src/a', task: 'task1', agent: 'claude-code', tags: [] }, content: { decision: 'd1', reason: 'r1' } })
    writeMemoryEntry({ memoryRepo: tempDir, frontmatter: { module: 'src/b', task: 'task2', agent: 'codex', tags: [] }, content: { decision: 'd2', reason: 'r2' } })

    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const lines = readFileSync(join(tempDir, 'index.jsonl'), 'utf-8').trim().split('\n')
    expect(lines).toHaveLength(2)
    expect(JSON.parse(lines[0]!).module).toBe('src/a')
    expect(JSON.parse(lines[1]!).module).toBe('src/b')
  })
})
```

**Acceptance check:** `pnpm test` passes all tests. Coverage above 80% for core modules.

---

## phase 11 — open-source readiness

**Task:** Everything needed to publish and invite contributors.

### 11.1 — README.md (repo root)

Write a README that covers:
1. One-paragraph what/why
2. Install (`npm install -g @agentkit/cli`)
3. Quick start (init → run → log — three commands, real output shown)
4. How it works (three-sentence explanation: CLI + MCP + git repos)
5. MCP integration (link to `docs/mcp-integration.md`)
6. Contributing (link to `docs/contributing.md`)
7. License

### 11.2 — `docs/contributing.md`

Cover:
- Monorepo setup (`pnpm install`, `pnpm build`, `pnpm test`)
- How to add a new CLI command (copy pattern from existing, register in index.ts)
- How to add a new playbook to the templates dir
- How to add a new MCP tool
- PR checklist: tests, typecheck, docs updated

### 11.3 — `docs/playbook-schema.md`

Full YAML schema reference with field descriptions and examples for every field in `Playbook` and `PlaybookStep`.

### 11.4 — `docs/memory-schema.md`

Full markdown schema reference — every frontmatter field, every section heading, what good/bad entries look like side by side.

### 11.5 — GitHub Actions

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install
      - run: pnpm build
      - run: pnpm typecheck
      - run: pnpm test
```

Create `.github/workflows/publish.yml`:
```yaml
name: Publish
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20', registry-url: 'https://registry.npmjs.org' }
      - run: pnpm install && pnpm build
      - run: pnpm -r publish --access public
        env: { NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} }
```

---

## build order summary

Execute phases in strict sequence. Do not start a phase until the previous phase's acceptance check passes.

| Phase | What | Output |
|-------|------|--------|
| 0 | Repo scaffolding | Monorepo builds, bins exist |
| 1 | Shared types | Types compile, export cleanly |
| 2 | Config + DB | Config loads, SQLite migrates |
| 3 | Memory write/read | Round-trip test passes |
| 4 | BM25 + embeddings + budget | Search returns ranked results |
| 5 | Playbook engine | Parses and renders all starters |
| 6 | CLI commands | `agentkit --help` works, all commands registered |
| 7 | MCP server | Server starts, tools respond |
| 8 | Starter content | Templates copy correctly on init |
| 9 | MCP config files | Settings JSON correct for Claude Code + Codex |
| 10 | Tests | `pnpm test` green, coverage ≥ 80% core |
| 11 | OSS readiness | README, docs, CI/CD, publish workflow |

---

## notes for codex

- Never use `any` — if you're unsure of a type, use `unknown` and narrow it
- Every `catch (err)` block must handle `err instanceof Error` before using `.message`
- All file paths must use `path.join()` — never string concatenation
- Git commands use `execSync` with `{ encoding: 'utf-8' }` and are wrapped in try/catch
- Environment variables are accessed via `process.env['KEY']` (bracket notation for strict mode)
- All async functions are `async/await` — no `.then()` chains
- Export only what other modules need — keep internals unexported
- Each command file exports exactly one `register*` function — nothing else
