/**
 * Repliers Address History Tool
 *
 * GET /listings — queries the standard listings endpoint with address filters
 * to return the full MLS history for a specific property address.
 */

import { BASE_URL, repliersGet } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  // Repliers API only accepts a single status value, so we call twice (A + U) and merge.
  // status=A → active listings at this address
  // status=U → historical: sold, terminated, expired
  const buildUrl = (status) => {
    const url = new URL(`${BASE_URL}/listings`);
    url.searchParams.set("city", args.city);
    url.searchParams.set("streetName", args.streetName);
    url.searchParams.set("streetNumber", args.streetNumber);
    url.searchParams.set("zip", args.zip);
    url.searchParams.set("status", status);
    if (args.unitNumber) url.searchParams.set("unitNumber", args.unitNumber);
    if (args.streetSuffix) url.searchParams.set("streetSuffix", args.streetSuffix);
    if (args.streetDirection) url.searchParams.set("streetDirection", args.streetDirection);
    return url;
  };

  // Run both in parallel
  const [activeResult, historicalResult] = await Promise.all([
    repliersGet(buildUrl("A")),
    repliersGet(buildUrl("U")),
  ]);

  // Merge listings, deduplicate by mlsNumber
  const allListings = [
    ...(activeResult.listings || []),
    ...(historicalResult.listings || []),
  ];
  const seen = new Set();
  const merged = allListings.filter((l) => {
    if (seen.has(l.mlsNumber)) return false;
    seen.add(l.mlsNumber);
    return true;
  });

  return {
    ...historicalResult,
    count: merged.length,
    listings: merged,
  };
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "get_address_history",
      description:
        "Retrieve the complete MLS listing history for a specific property address. Returns all past and current listings at that address. Requires city, streetName, streetNumber, and zip. Use unitNumber for condos/apartments.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City of the property (e.g. 'Toronto')",
          },
          streetName: {
            type: "string",
            description: "Street name without suffix or direction (e.g. 'Yonge', 'King')",
          },
          streetNumber: {
            type: "string",
            description: "Street number (e.g. '123')",
          },
          zip: {
            type: "string",
            description: "Postal/zip code (e.g. 'M5V 2T6')",
          },
          unitNumber: {
            type: "string",
            description: "Unit number for condos/apartments (e.g. '401')",
          },
          streetSuffix: {
            type: "string",
            description: "Street suffix (e.g. 'St', 'Ave', 'Blvd')",
          },
          streetDirection: {
            type: "string",
            description: "Street direction (e.g. 'N', 'S', 'E', 'W')",
          },
        },
        required: ["city", "streetName", "streetNumber", "zip"],
      },
    },
  },
};

export { apiTool };
