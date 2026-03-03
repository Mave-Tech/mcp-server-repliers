/**
 * Repliers Find Similar Listings Tool
 *
 * GET /listings/{mlsNumber}/similar — returns listings that are similar to the
 * given listing based on location, price, and property type.
 */

import { BASE_URL, repliersGet } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/listings/${args.mlsNumber}/similar`);
  if (args.boardId) args.boardId.forEach((id) => url.searchParams.append("boardId", id));
  if (args.fields) url.searchParams.set("fields", args.fields);
  if (args.listPriceRange) url.searchParams.set("listPriceRange", String(args.listPriceRange));
  if (args.radius) url.searchParams.set("radius", String(args.radius));
  if (args.sortBy) url.searchParams.set("sortBy", args.sortBy);
  return repliersGet(url);
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "find_similar_listings",
      description:
        "Find listings similar to a given MLS listing. Returns up to 20 comparable properties based on location, price, and property characteristics. Note: may return empty results for brand-new listings that have just been posted.",
      parameters: {
        type: "object",
        properties: {
          mlsNumber: {
            type: "string",
            description: "MLS number of the reference listing",
          },
          boardId: {
            type: "array",
            items: { type: "number" },
            description: "Filter by one or more board IDs",
          },
          fields: {
            type: "string",
            description:
              'Limit response fields (e.g. "listPrice,soldPrice" or "images[5]")',
          },
          listPriceRange: {
            type: "number",
            description:
              "Return listings within +/- this price range in dollars (e.g. 250000)",
          },
          radius: {
            type: "number",
            description: "Restrict results to within this radius in kilometres",
          },
          sortBy: {
            type: "string",
            enum: ["updatedOnDesc", "updatedOnAsc", "createdOnAsc", "createdOnDesc"],
            description: "Sort order for results",
          },
        },
        required: ["mlsNumber"],
      },
    },
  },
};

export { apiTool };
