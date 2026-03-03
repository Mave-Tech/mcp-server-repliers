/**
 * Repliers MLS Offices Tool
 *
 * GET /offices — list and search MLS offices (brokerages may have one or more
 * offices). Useful for looking up an office by name or finding all offices for
 * a given board.
 */

import { BASE_URL, repliersGet, appendParams } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/offices`);
  appendParams(url, {
    keywords: args.keywords,
    boardId: args.boardId,
    pageNum: args.pageNum,
    resultsPerPage: args.resultsPerPage,
  });
  return repliersGet(url);
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "search_offices",
      description:
        "Search and list MLS offices. A brokerage may have one or more offices. Returns officeId, name, and address for each office. Use keywords to search by office name, or boardId to filter to a specific MLS board.",
      parameters: {
        type: "object",
        properties: {
          keywords: {
            type: "string",
            description: "Filter offices by name (e.g. 'RE/MAX', 'Royal LePage')",
          },
          boardId: {
            type: "string",
            description: "Filter by MLS board ID",
          },
          pageNum: {
            type: "number",
            minimum: 1,
            description: "Page number (default: 1)",
          },
          resultsPerPage: {
            type: "number",
            minimum: 1,
            description: "Results per page",
          },
        },
        required: [],
      },
    },
  },
};

export { apiTool };
