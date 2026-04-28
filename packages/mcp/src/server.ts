import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types";
import { getTeamConfig, loadConfig } from "@agentlayer/cli/config/loader";
import { searchMemory } from "@agentlayer/cli/core/memory/search";
import { writeMemoryEntry } from "@agentlayer/cli/core/memory/writer";
import { SessionCache } from "./cache/session.js";

type QueryIntent = "understand" | "extend" | "debug" | "review";

interface QueryArguments {
  query: string;
  module?: string;
  intent?: QueryIntent;
}

interface LogArguments {
  decision: string;
  reason: string;
  module?: string;
  rejected?: string;
  tags?: string[];
}

function resolveTeamName(defaultTeam?: string): string | undefined {
  const envTeam = process.env["AGENTLAYER_TEAM"];

  if (envTeam) {
    return envTeam;
  }

  const teamArgIndex = process.argv.findIndex((arg) => arg === "--team");

  if (teamArgIndex >= 0) {
    return process.argv[teamArgIndex + 1];
  }

  return defaultTeam;
}

function emptyResponse(): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text", text: "" }],
  };
}

const server = new Server(
  { name: "agentlayer", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

const sessionCache = new SessionCache();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "agentlayer_query",
      description:
        "Query team memory for decisions, patterns, rejected approaches, and module-specific context before making changes.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Natural-language question about the codebase or a prior decision.",
          },
          module: {
            type: "string",
            description: "Optional module path to narrow the search.",
          },
          intent: {
            type: "string",
            enum: ["understand", "extend", "debug", "review"],
            description: "Controls the token budget and ranking context.",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "agentlayer_log",
      description:
        "Write a significant decision or implementation lesson into team memory.",
      inputSchema: {
        type: "object" as const,
        properties: {
          decision: {
            type: "string",
            description: "What was decided or implemented.",
          },
          reason: {
            type: "string",
            description: "Why this approach was chosen.",
          },
          module: {
            type: "string",
            description: "Optional module path for the memory entry.",
          },
          rejected: {
            type: "string",
            description: "Optional rejected alternative.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Optional classification tags.",
          },
        },
        required: ["decision", "reason"],
      },
    },
  ],
}));

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: { params: { name: string; arguments?: unknown } }) => {
  const config = loadConfig();

  if (!config.globalEnabled) {
    return emptyResponse();
  }

  const teamName = resolveTeamName(config.defaultTeam);

  if (!teamName) {
    return {
      content: [
        {
          type: "text",
          text: "agentlayer: no team configured. Run agentlayer init first.",
        },
      ],
    };
  }

  const team = getTeamConfig(config, teamName);

  if (!team.enabled) {
    return emptyResponse();
  }

  if (request.params.name === "agentlayer_query") {
    const args = (request.params.arguments ?? {}) as QueryArguments;
    const moduleName = args.module ?? "global";
    const intent = args.intent ?? "understand";
    const cacheKey = `${moduleName}:${intent}:${args.query}`;
    const cached = sessionCache.get(cacheKey);

    if (cached) {
      return {
        content: [{ type: "text", text: cached }],
      };
    }

    const result = await searchMemory({
      memoryRepo: team.memoryRepo,
      query: args.query,
      ...(args.module ? { module: args.module } : {}),
      intent,
      ...(process.env["ANTHROPIC_API_KEY"]
        ? { apiKey: process.env["ANTHROPIC_API_KEY"] }
        : {}),
    });

    sessionCache.set(cacheKey, result);

    return {
      content: [{ type: "text", text: result }],
    };
  }

  if (request.params.name === "agentlayer_log") {
    const args = (request.params.arguments ?? {}) as LogArguments;
    const result = writeMemoryEntry({
      memoryRepo: team.memoryRepo,
      frontmatter: {
        module: args.module ?? "global",
        task: args.decision.slice(0, 60),
        agent: "codex",
        tags: args.tags ?? [],
      },
      content: {
        decision: args.decision,
        reason: args.reason,
        ...(args.rejected ? { rejected: args.rejected } : {}),
      },
    });

    return {
      content: [{ type: "text", text: `Memory logged: ${result.filePath}` }],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Unknown tool: ${request.params.name}`,
      },
    ],
  };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
