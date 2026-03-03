import { toolPaths } from "../tools/paths.js";

// Names of tool export keys used across tool files
const TOOL_EXPORT_KEYS = [
  "apiTool",
  "repliersListingsSearchTool",
  "nlpPromptsTool",
  "nlpSessionsTool",
];

/**
 * Discovers and loads available tools from the tools directory.
 * Supports files that export a single tool (apiTool / repliersListingsSearchTool)
 * or multiple tools (any key ending in 'Tool').
 * @returns {Promise<Array>} Flat array of tool objects
 */
export async function discoverTools() {
  const toolPromises = toolPaths.map(async (file) => {
    const module = await import(`../tools/${file}`);
    const tools = [];

    for (const key of TOOL_EXPORT_KEYS) {
      if (module[key] && module[key].function && module[key].definition) {
        tools.push({ ...module[key], path: file });
      }
    }

    // Fallback: pick up any export that looks like a tool
    if (tools.length === 0) {
      for (const [key, value] of Object.entries(module)) {
        if (value && typeof value === "object" && value.function && value.definition) {
          tools.push({ ...value, path: file });
        }
      }
    }

    return tools;
  });

  const nested = await Promise.all(toolPromises);
  return nested.flat();
}
