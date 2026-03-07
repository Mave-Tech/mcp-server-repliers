#!/usr/bin/env node

import dotenv from "dotenv";
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { discoverTools } from "./lib/tools.js";
import { trimResponse } from "./lib/response-trimmer.js";

dotenv.config();

if (!process.env.REPLIERS_API_KEY) {
  console.error("FATAL: REPLIERS_API_KEY environment variable is required");
  process.exit(1);
}

const SERVER_NAME = "repliers-mcp-server";
const SERVER_VERSION = "0.1.0";

// All tools are read-only calls to the Repliers API
const TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

function buildToolList(tools) {
  return tools
    .map((tool) => {
      const def = tool.definition?.function;
      if (!def) return null;
      return {
        name: def.name,
        description: def.description,
        inputSchema: def.parameters,
        annotations: TOOL_ANNOTATIONS,
      };
    })
    .filter(Boolean);
}

function createServer() {
  return new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );
}

async function setupHandlers(server, tools) {
  const toolList = buildToolList(tools);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolList }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const tool = tools.find((t) => t.definition.function.name === toolName);

    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }

    const args = request.params.arguments ?? {};
    const required = tool.definition?.function?.parameters?.required ?? [];
    for (const param of required) {
      if (!(param in args)) {
        throw new McpError(ErrorCode.InvalidParams, `Missing required parameter: ${param}`);
      }
    }

    try {
      const result = await tool.function(args);

      // Surface API errors as tool-level errors (isError: true) rather than
      // silent data, so clients know the tool call failed.
      if (result.error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: [
                result.url ? `API Endpoint: ${result.url}` : null,
                `Error: ${result.error}`,
                result.details ? `Details: ${JSON.stringify(result.details, null, 2)}` : null,
              ]
                .filter(Boolean)
                .join("\n"),
            },
          ],
        };
      }

      // Preserve top-level fields (nlpId, translatedUrl, summary) alongside trimmed data.
      // Some tools (e.g. nlp_search) return { nlpId, summary, data: {...} } — we need all of it.
      const rawData = result.data ?? result;
      const trimmedData = trimResponse(rawData);

      // Collect any top-level tool fields that aren't 'data', 'url', 'status'
      const extraFields = {};
      for (const [k, v] of Object.entries(result)) {
        if (!['data', 'url', 'status'].includes(k) && v !== undefined) {
          extraFields[k] = v;
        }
      }

      const finalData = Object.keys(extraFields).length > 0
        ? { ...extraFields, ...trimmedData }
        : trimmedData;

      return {
        content: [
          {
            type: "text",
            text: `API Endpoint: ${result.url || result.translatedUrl || 'N/A'}`,
          },
          {
            type: "text",
            text: JSON.stringify(finalData, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  });
}

async function runStdio() {
  const tools = await discoverTools();
  const server = createServer();
  server.onerror = (error) => console.error("[MCP error]", error);
  await setupHandlers(server, tools);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} running via stdio (${tools.length} tools)`);

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Keep alive
  await new Promise(() => {});
}

async function runHTTP() {
  const tools = await discoverTools();
  const app = express();
  app.use(express.json());

  // Ensure Accept header includes both required MIME types for MCP SDK compatibility
  app.post("/mcp", (req, res, next) => {
    const accept = req.headers.accept || "";
    if (!accept.includes("text/event-stream")) {
      req.headers.accept = "application/json, text/event-stream";
    }
    next();
  });

  // Stateless streamable HTTP — a new transport per request (no session state)
  app.post("/mcp", async (req, res) => {
    const server = createServer();
    server.onerror = (error) => console.error("[MCP error]", error);
    await setupHandlers(server, tools);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3001");
  app.listen(port, () => {
    console.error(`${SERVER_NAME} running on http://localhost:${port}/mcp (${tools.length} tools)`);
  });
}

// Select transport from --http flag or TRANSPORT env var
const args = process.argv.slice(2);
const useHTTP = args.includes("--http") || args.includes("--sse") || process.env.TRANSPORT === "http";

if (useHTTP) {
  runHTTP().catch((error) => {
    console.error("Fatal:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Fatal:", error);
    process.exit(1);
  });
}
