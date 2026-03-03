/**
 * Repliers Property Types & Styles Tool
 *
 * GET /listings/property-types — returns the full reference list of property
 * types and architectural styles available in the MLS.
 */

import { BASE_URL, repliersGet } from "../../../lib/api-client.js";

const executeFunction = async () => {
  const url = new URL(`${BASE_URL}/listings/property-types`);
  return repliersGet(url);
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "list_property_types_and_styles",
      description:
        "List all available MLS property types and architectural styles. No parameters required. Use this to discover valid values for the propertyType and style filters in repliers_listings_search.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
};

export { apiTool };
