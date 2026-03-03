/**
 * Repliers Locations Tool (legacy endpoint)
 *
 * GET /listings/locations — returns a hierarchical list of areas, cities, and
 * neighborhoods available in the MLS. All parameters are optional.
 *
 * For more powerful location search (locationId, boundary polygons, geospatial
 * filtering), use search_locations instead.
 */

import { BASE_URL, repliersGet } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/listings/locations`);
  if (args.area) url.searchParams.set("area", args.area);
  if (args.city) url.searchParams.set("city", args.city);
  if (args.class) url.searchParams.set("class", args.class);
  if (args.neighborhood) url.searchParams.set("neighborhood", args.neighborhood);
  if (args.search) url.searchParams.set("search", args.search);
  return repliersGet(url);
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "list_locations",
      description:
        "List MLS geographic locations (areas, cities, neighborhoods). All parameters are optional — call with no params to get the full hierarchy. Use the search param for partial-match lookup across all levels. For locationIds or boundary polygons, use search_locations instead.",
      parameters: {
        type: "object",
        properties: {
          area: {
            type: "string",
            description: "Filter to areas matching this value",
          },
          city: {
            type: "string",
            description: "Filter to cities matching this value",
          },
          class: {
            type: "string",
            description: "Filter by listing class (e.g. 'condo', 'residential')",
          },
          neighborhood: {
            type: "string",
            description: "Filter to neighborhoods matching this value",
          },
          search: {
            type: "string",
            description:
              "Partial-match search across areas, cities, and neighborhoods simultaneously",
          },
        },
        required: [],
      },
    },
  },
};

export { apiTool };
