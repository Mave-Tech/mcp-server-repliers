/**
 * Repliers Search Locations Tool
 *
 * GET /locations — full location search with filtering, geospatial options,
 * and boundary polygon data. More powerful than /listings/locations:
 * supports locationId filtering, map/radius search, boundary polygons,
 * and pagination up to 300 results.
 *
 * Response: locations[] with locationId, name, type, map{lat,lng,boundary}, address
 */

import { BASE_URL, repliersGet, appendParams } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/locations`);
  appendParams(url, {
    type: args.type,
    state: args.state,
    area: args.area,
    city: args.city,
    neighborhood: args.neighborhood,
    locationId: args.locationId,
    lat: args.lat,
    long: args.long,
    radius: args.radius,
    hasBoundary: args.hasBoundary,
    fields: args.fields,
    sortBy: args.sortBy,
    pageNum: args.pageNum,
    resultsPerPage: args.resultsPerPage || 50,
  });
  // map is JSON-stringified as a query param
  if (args.map) url.searchParams.set("map", JSON.stringify(args.map));
  return repliersGet(url);
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "search_locations",
      description:
        "Search MLS locations (neighborhoods, cities, areas) with full filtering and geospatial support. Returns locationIds, canonical names, coordinates, and optional boundary polygons. Use this to look up locations by type/city/area, find locations within a radius or map polygon, retrieve boundary polygons for map rendering, or get locationIds to pass to repliers_listings_search.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["area", "city", "neighborhood"],
            description: "Filter to a specific location type",
          },
          state: {
            type: "array",
            items: { type: "string" },
            description: "Filter by 2-letter state/province codes (e.g. ['ON'])",
          },
          area: {
            type: "string",
            description: "Filter to locations within a specific area/region",
          },
          city: {
            type: "string",
            description: "Filter to locations within a specific city",
          },
          neighborhood: {
            type: "string",
            description: "Filter to a specific neighbourhood by name",
          },
          locationId: {
            type: "array",
            items: { type: "string" },
            description:
              "Look up specific locations by their locationId (from autocomplete results)",
          },
          lat: {
            type: "number",
            description: "Latitude for radius-based search (requires long and radius)",
          },
          long: {
            type: "number",
            description: "Longitude for radius-based search (requires lat and radius)",
          },
          radius: {
            type: "number",
            description: "Search radius in km (requires lat and long)",
          },
          map: {
            type: "array",
            description: "GeoJSON polygon to filter locations within a boundary",
          },
          hasBoundary: {
            type: "boolean",
            description: "Only return locations that have boundary polygon data available",
          },
          fields: {
            type: "string",
            description:
              "Comma-separated fields to include in response (e.g. 'name,locationId,address.city')",
          },
          sortBy: {
            type: "string",
            description: "Sort order for results",
          },
          pageNum: {
            type: "number",
            minimum: 1,
            description: "Page number (default: 1)",
          },
          resultsPerPage: {
            type: "number",
            minimum: 1,
            maximum: 300,
            description: "Results per page (default: 50, max: 300)",
          },
        },
        required: [],
      },
    },
  },
};

export { apiTool };
