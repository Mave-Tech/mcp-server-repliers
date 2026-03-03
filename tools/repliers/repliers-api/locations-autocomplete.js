/**
 * Repliers Locations Autocomplete Tool
 *
 * GET /locations/autocomplete — resolves partial location names into structured
 * MLS location objects with canonical names, unique locationIds, types, and
 * coordinates.
 *
 * Note: uses fuzzy/phonetic matching — verify returned name and city fields
 * to confirm relevance before passing to search.
 */

import { BASE_URL, repliersGet, appendParams } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/locations/autocomplete`);
  appendParams(url, {
    search: args.search,
    type: args.type,
    boardId: args.boardId,
    state: args.state,
    area: args.area,
    city: args.city,
    lat: args.lat,
    long: args.long,
    radius: args.radius,
    hasBoundary: args.hasBoundary,
    boundary: args.boundary,
    fields: args.fields,
    resultsPerPage: args.resultsPerPage,
  });
  return repliersGet(url);
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "locations_autocomplete",
      description:
        "Resolve a partial or ambiguous location name into structured MLS location objects. Returns canonical names, unique locationIds, types (neighborhood/city/area), and coordinates. Note: uses fuzzy/phonetic matching — verify returned name and city fields before using in search. Use this to confirm the exact MLS neighbourhood name or get a locationId for use in repliers_listings_search.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description:
              "Partial or full location name to search (e.g. 'Corso', 'Liberty Village', 'Rosedale'). Minimum 3 characters.",
          },
          type: {
            type: "string",
            enum: ["neighborhood", "city", "area"],
            description: "Filter to a specific location type",
          },
          boardId: {
            type: "number",
            description: "Filter by MLS board ID (only needed for multi-board accounts)",
          },
          state: {
            type: "array",
            items: { type: "string" },
            description: "Filter by 2-letter state/province codes (e.g. ['ON', 'BC'])",
          },
          area: {
            type: "array",
            items: { type: "string" },
            description: "Restrict search to specific areas",
          },
          city: {
            type: "array",
            items: { type: "string" },
            description: "Restrict search to specific cities",
          },
          lat: {
            type: "number",
            description: "Latitude for proximity-based results (requires long and radius)",
          },
          long: {
            type: "number",
            description: "Longitude for proximity-based results (requires lat and radius)",
          },
          radius: {
            type: "number",
            description: "Search radius in km (requires lat and long)",
          },
          hasBoundary: {
            type: "boolean",
            description: "Only return locations that have boundary polygon data",
          },
          boundary: {
            type: "boolean",
            description: "Include the boundary polygon in the response",
          },
          fields: {
            type: "string",
            description:
              "Comma-separated fields to return (e.g. 'name,address.city,address.state')",
          },
          resultsPerPage: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "Number of results (default: 10, max: 10)",
          },
        },
        required: ["search"],
      },
    },
  },
};

export { apiTool };
