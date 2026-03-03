/**
 * Repliers Buildings Search Tool
 *
 * POST /buildings — searches building/complex-level data.
 * Filters go as URL query parameters; map (GeoJSON) goes in the request body.
 *
 * Response: buildings[] with address, nearby{amenities[]}, details{minSqft,maxSqft},
 *           map{latitude,longitude}, image, class
 */

import { BASE_URL, repliersPost, appendParams, withMetadata } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/buildings`);
  const bodyParams = {};

  if (args.params) {
    const { map, ...queryParams } = args.params;
    // map goes in the body (GeoJSON polygon)
    if (map) bodyParams.map = map;
    // Everything else goes as query params
    appendParams(url, queryParams);
  }

  if (args.pageNum !== undefined) url.searchParams.set("pageNum", String(args.pageNum));
  const rpp = args.resultsPerPage || parseInt(process.env.RESULTS_PER_PAGE) || 100;
  url.searchParams.set("resultsPerPage", String(rpp));

  const result = await repliersPost(url, Object.keys(bodyParams).length > 0 ? bodyParams : null);
  return withMetadata(result, args.pageNum, rpp);
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "search_buildings",
      description:
        "Search for building and complex-level data using the Repliers API. Returns buildings rather than individual unit listings — useful for discovering condo buildings in an area, building-level browsing, or map views. Each building includes address, nearby amenities, sqft range, coordinates, and a cover image.",
      parameters: {
        type: "object",
        properties: {
          params: {
            type: "object",
            description: "Building search filters",
            properties: {
              // Location
              area: {
                type: "array",
                items: { type: "string" },
                description: "Filter by geographical area/region",
              },
              city: {
                type: "array",
                items: { type: "string" },
                description: "Filter buildings by one or more cities",
              },
              neighborhood: {
                type: "array",
                items: { type: "string" },
                description: "Filter by one or more neighbourhoods",
              },

              // Geographic
              lat: {
                type: "string",
                description: "Latitude for radius search (requires long and radius)",
              },
              long: {
                type: "string",
                description: "Longitude for radius search (requires lat and radius)",
              },
              radius: {
                type: "number",
                description: "Search radius in km (requires lat and long)",
              },
              map: {
                type: "array",
                description:
                  "GeoJSON polygon array (sent as request body). Format: [[[lng,lat],...]] for single polygon",
              },

              // Property classification
              class: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["condo", "residential", "commercial"],
                },
                description: "Filter by property class",
              },
              propertyType: {
                type: "array",
                items: { type: "string" },
                description: "Filter by property types",
              },

              // Building
              buildingName: {
                type: "string",
                description: "Filter by building name (partial match)",
              },
              minStories: {
                type: "number",
                description: "Minimum number of storeys",
              },
              maxStories: {
                type: "number",
                description: "Maximum number of storeys",
              },

              // Price range for units
              minPrice: {
                type: "number",
                description: "Minimum unit price",
              },
              maxPrice: {
                type: "number",
                description: "Maximum unit price",
              },

              // Bedrooms for units
              minBeds: {
                type: "number",
                description: "Minimum bedrooms in building units",
              },
              maxBeds: {
                type: "number",
                description: "Maximum bedrooms in building units",
              },

              // Address
              streetName: {
                type: "string",
                description: "Filter by street name (e.g. 'Yonge')",
              },
              streetNumber: {
                type: "string",
                description: "Filter by street number",
              },

              // Listing type
              type: {
                type: "string",
                enum: ["sale", "lease"],
                description: "Filter by listing type",
              },

              // Display
              displayPublic: {
                type: "string",
                enum: ["Y", "N"],
                description: "Y = public buildings only, N = password-protected only",
              },

              // Sorting
              sortBy: {
                type: "string",
                enum: ["numUnitsDesc"],
                description: "Sort by number of active units descending",
              },
            },
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
            description: "Buildings per page (default: 100, max: 300)",
          },
        },
        required: [],
      },
    },
  },
};

export { apiTool };
