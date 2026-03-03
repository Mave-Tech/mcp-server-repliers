/**
 * Repliers Deleted Listings Tool
 *
 * GET /listings/deleted — retrieves listings that have been removed from the MLS
 * within a given date range. Useful for syncing a local database.
 */

import { BASE_URL, repliersGet } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/listings/deleted`);
  if (args.updatedOn) url.searchParams.set("updatedOn", args.updatedOn);
  if (args.minUpdatedOn) url.searchParams.set("minUpdatedOn", args.minUpdatedOn);
  if (args.maxUpdatedOn) url.searchParams.set("maxUpdatedOn", args.maxUpdatedOn);
  return repliersGet(url);
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "get_deleted_listings",
      description:
        "Retrieve MLS listings that were deleted within a date range. Useful for keeping a local database in sync. Provide at least one date filter (updatedOn for an exact date, or minUpdatedOn/maxUpdatedOn for a range). Dates must be YYYY-MM-DD format.",
      parameters: {
        type: "object",
        properties: {
          updatedOn: {
            type: "string",
            description: "Exact deletion date (YYYY-MM-DD)",
          },
          minUpdatedOn: {
            type: "string",
            description: "Range start date (YYYY-MM-DD)",
          },
          maxUpdatedOn: {
            type: "string",
            description: "Range end date (YYYY-MM-DD)",
          },
        },
        required: ["updatedOn", "minUpdatedOn", "maxUpdatedOn"],
      },
    },
  },
};

export { apiTool };
