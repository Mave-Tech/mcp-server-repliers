/**
 * Repliers Get Listing Tool
 *
 * GET /listings/{mlsNumber} — retrieves full details for a single listing
 * by its MLS number.
 */

import { BASE_URL, repliersGet } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/listings/${args.mlsNumber}`);
  if (args.boardId) url.searchParams.set("boardId", String(args.boardId));
  return repliersGet(url);
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "get_listing",
      description:
        "Retrieve full details for a single MLS listing by its MLS number. Returns all listing fields including price, address, rooms, features, images, and history. Use this when you already know a specific mlsNumber.",
      parameters: {
        type: "object",
        properties: {
          mlsNumber: {
            type: "string",
            description: "The MLS number of the listing to retrieve (e.g. 'C12345678')",
          },
          boardId: {
            type: "number",
            description:
              "Board ID — only required if your account has access to more than one MLS board",
          },
        },
        required: ["mlsNumber"],
      },
    },
  },
};

export { apiTool };
