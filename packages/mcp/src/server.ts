import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types";
import { loadConfig } from "@ashirwad-shetye/agentlayer-cli/config/loader";
import { resolveProjectPaths } from "@ashirwad-shetye/agentlayer-cli/config/project-paths";
import { searchMemory } from "@ashirwad-shetye/agentlayer-cli/core/memory/search";
import { writeMemoryEntry } from "@ashirwad-shetye/agentlayer-cli/core/memory/writer";
import { SessionCache } from "./cache/session.js";
import {
  buildQueryCacheKey,
  buildRetrievalQuery,
} from "./query-context.js";
import { parseLogArguments, parseQueryArguments } from "./tool-arguments.js";

function emptyResponse(): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text", text: "" }],
  };
}

const server = new Server(
  { name: "agentlayer", version: "0.1.3" },
  { capabilities: { tools: {} } },
);

const sessionCache = new SessionCache();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "agentlayer_query",
      description:
        "Query project memory for decisions, patterns, rejected approaches, and module-specific context before making changes.",
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
          task: {
            type: "string",
            description: "Optional current task or plan step to shape retrieval.",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Optional relevant file paths for the current work.",
          },
          error: {
            type: "string",
            description: "Optional current error or failure signal to include in retrieval.",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Optional extracted terms that should influence retrieval.",
          },
          agent: {
            type: "string",
            description: "Optional agent identifier for the current work session.",
          },
          phase: {
            type: "string",
            enum: ["planning", "implementation", "debugging", "review"],
            description: "Optional current work phase.",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "agentlayer_log",
      description:
        "Write a significant decision or implementation lesson into project memory.",
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
          tradeoffAccepted: {
            type: "string",
            description: "Optional accepted downside or implementation tradeoff.",
          },
          open: {
            type: "string",
            description: "Optional unresolved follow-up or remaining question.",
          },
          reusablePattern: {
            type: "string",
            description: "Optional reusable pattern future agents or developers can apply.",
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
  const paths = resolveProjectPaths(process.cwd());

  if (request.params.name === "agentlayer_query") {
    const parsed = parseQueryArguments(request.params.arguments ?? {});

    if (!parsed.value) {
      return {
        content: [{ type: "text", text: parsed.error ?? "Invalid query arguments." }],
        isError: true,
      };
    }

    const args = parsed.value;
    const intent = args.intent ?? "understand";
    const retrieval = buildRetrievalQuery({
      ...args,
      intent,
    });
    const cacheKey = buildQueryCacheKey({
      ...args,
      intent,
    });
    const cached = sessionCache.get(cacheKey);

    if (cached) {
      return {
        content: [{ type: "text", text: cached }],
      };
    }

    const result = await searchMemory({
      memoryRepo: paths.memoryDir,
      query: args.query,
      ...(args.module ? { module: args.module } : {}),
      intent,
      retrieval,
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
    const parsed = parseLogArguments(request.params.arguments ?? {});

    if (!parsed.value) {
      return {
        content: [{ type: "text", text: parsed.error ?? "Invalid log arguments." }],
        isError: true,
      };
    }

    const args = parsed.value;
    const result = writeMemoryEntry({
      memoryRepo: paths.memoryDir,
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
        ...(args.tradeoffAccepted
          ? { tradeoffAccepted: args.tradeoffAccepted }
          : {}),
        ...(args.open ? { open: args.open } : {}),
        ...(args.reusablePattern
          ? { reusablePattern: args.reusablePattern }
          : {}),
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
