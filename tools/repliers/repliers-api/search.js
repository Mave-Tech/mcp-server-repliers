/**
 * Repliers Listings Search Tool
 *
 * GET /listings (or POST /listings when map or imageSearchItems are provided).
 * All params go under a params object; pageNum and resultsPerPage are top-level.
 */

import { BASE_URL, repliersGet, repliersPost, appendParams, withMetadata } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/listings`);
  const bodyParams = {};

  if (args.params) {
    const { imageSearchItems, map, ...queryParams } = args.params;
    if (imageSearchItems && Array.isArray(imageSearchItems)) bodyParams.imageSearchItems = imageSearchItems;
    if (map) bodyParams.map = map;
    appendParams(url, queryParams);
  }

  if (args.pageNum !== undefined) url.searchParams.set("pageNum", String(args.pageNum));
  const rpp = args.resultsPerPage || parseInt(process.env.RESULTS_PER_PAGE) || 10;
  url.searchParams.set("resultsPerPage", String(rpp));

  const hasBody = Object.keys(bodyParams).length > 0;
  const result = hasBody ? await repliersPost(url, bodyParams) : await repliersGet(url);
  return withMetadata(result, args.pageNum, rpp);
};


const repliersListingsSearchTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "repliers_listings_search",
      description:
        "Primary tool for searching Canadian MLS listings (active, sold, leased, terminated, expired). All filters go inside a 'params' object and ALL filter values must be arrays (e.g. city: ['Toronto'], status: ['A']). Use statistics codes (avg-soldPrice, med-daysOnMarket, etc.) for market analytics. IMPORTANT: For sold-price/DOM/pct-aboveBelowList stats, always set status: ['U']. Add listings: false when you only need statistics to reduce response size. imageSearchItems and map parameters trigger a POST request.",
      parameters: {
        type: "object",
        properties: {
          params: {
            type: "object",
            properties: {
              // Location parameters
              city: {
                type: "array",
                items: { type: "string" },
                description: "Filter listing by one or more cities",
              },
              state: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filter by the address state of the listing, for example 'ON' or 'NY'",
              },
              area: {
                type: "string",
                description:
                  "Filter by the geographical area of the listing (also referred to as region)",
              },
              areaOrCity: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filters listings where either the address.area or address.city field matches any of the provided values",
              },
              cityOrDistrict: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filters listings where either the address.city or address.district field matches any of the provided values",
              },
              neighborhood: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filter by the geographical neighborhood that the listing is situated in",
              },
              district: {
                type: "string",
                description:
                  "Filter by the geographical district of the listing",
              },
              zip: {
                type: "array",
                items: { type: "string" },
                description: "Filters listings by one or more postal or zip codes",
              },
              locationId: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filters listings by one or more locationId values (from the locations_autocomplete or search_locations tools)",
              },
              addressKey: {
                type: "string",
                description: "The address key of the property (unique address identifier)",
              },
              zoning: {
                type: "string",
                description: "Filter listings by zoning description",
              },

              // Address parameters
              streetName: {
                type: "string",
                description:
                  "Filter by the street name of the listing (excluding the street suffix and direction, for example 'Yonge')",
              },
              streetNumber: {
                type: "string",
                description: "Filter by the street number of the listing",
              },
              minStreetNumber: {
                type: "number",
                description:
                  "Filter results where street number is greater than or equal to this value",
              },
              maxStreetNumber: {
                type: "number",
                description:
                  "Filter results where street number is less than or equal to this value",
              },
              streetDirection: {
                type: "array",
                items: { type: "string" },
                description: "Filter listings by one or more street directions",
              },
              streetSuffix: {
                type: "array",
                items: { type: "string" },
                description: "Filter listings by one or more street suffixes",
              },
              unitNumber: {
                type: "array",
                items: { type: "string" },
                description: "Filter by one or more unit numbers",
              },

              // Geographic parameters
              lat: {
                type: "string",
                description:
                  "Latitude value. Must be used with radius parameter",
              },
              long: {
                type: "string",
                description:
                  "Longitude value. Must be used with radius parameter",
              },
              radius: {
                type: "number",
                description:
                  "Radius in KM. Must be used with lat and long parameters",
              },
              map: {
                type: "array",
                description:
                  "GeoJSON polygon coordinates array (sent in request body, triggers POST). Format: [[[lng,lat],[lng,lat],...]] for single polygon or [[polygon1],[polygon2],...] for multipolygon",
              },
              mapOperator: {
                type: "string",
                enum: ["OR", "AND"],
                description:
                  "For multi-polygon map parameter: OR (default) = inside any polygon, AND = inside all polygons",
              },

              // Price parameters
              minPrice: {
                type: "number",
                description: "Minimum listing price",
              },
              maxPrice: {
                type: "number",
                description: "Maximum listing price",
              },
              minSoldPrice: {
                type: "number",
                description:
                  "Filter listings whose sold price is >= the supplied value",
              },
              maxSoldPrice: {
                type: "number",
                description:
                  "Filter listings whose sold price is <= the supplied value",
              },
              minMaintenanceFee: {
                type: "number",
                description: "Minimum maintenance fee",
              },
              maxMaintenanceFee: {
                type: "number",
                description: "Maximum maintenance fee",
              },
              minTaxes: {
                type: "number",
                description: "Minimum annual tax amount",
              },
              maxTaxes: {
                type: "number",
                description: "Maximum annual tax amount",
              },

              // Property details
              propertyType: {
                type: "array",
                items: { type: "string" },
                description: "Filters listings by one or more property types",
              },
              propertyTypeOrStyle: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filters where either propertyType or style matches",
              },
              class: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["condo", "residential", "commercial"],
                },
                description: "The class of listing to filter by",
              },
              style: {
                type: "array",
                items: { type: "string" },
                description: "Filter by the property style of the listing",
              },

              // Room parameters
              minBedrooms: {
                type: "number",
                description:
                  "Minimum bedrooms from original floorplan (above grade)",
              },
              maxBedrooms: {
                type: "number",
                description:
                  "Maximum bedrooms from original floorplan (above grade)",
              },
              minBedroomsPlus: {
                type: "number",
                description: "Minimum additional bedrooms (basement/attic)",
              },
              maxBedroomsPlus: {
                type: "number",
                description: "Maximum additional bedrooms (basement/attic)",
              },
              minBedroomsTotal: {
                type: "number",
                description: "Minimum total bedrooms (bedrooms + bedroomsPlus)",
              },
              maxBedroomsTotal: {
                type: "number",
                description: "Maximum total bedrooms (bedrooms + bedroomsPlus)",
              },
              minBaths: {
                type: "number",
                description: "Minimum number of bathrooms",
              },
              maxBaths: {
                type: "number",
                description: "Maximum number of bathrooms",
              },
              minBathroomsHalf: {
                type: "number",
                description: "Minimum number of half bathrooms",
              },
              maxBathroomsHalf: {
                type: "number",
                description: "Maximum number of half bathrooms",
              },
              minKitchens: {
                type: "number",
                description: "Minimum number of kitchens",
              },
              maxKitchens: {
                type: "number",
                description: "Maximum number of kitchens",
              },

              // Stories
              minStories: {
                type: "number",
                description: "Filter listings whose number of stories is >= this value",
              },
              maxStories: {
                type: "number",
                description: "Filter listings whose number of stories is <= this value",
              },

              // Lot size
              minLotSizeSqft: {
                type: "number",
                description: "Minimum lot size in square feet",
              },
              maxLotSizeSqft: {
                type: "number",
                description: "Maximum lot size in square feet",
              },

              // Size parameters
              minSqft: {
                type: "number",
                description:
                  "Minimum square footage (excludes listings without sqft)",
              },
              maxSqft: {
                type: "number",
                description:
                  "Maximum square footage (excludes listings without sqft)",
              },
              sqft: {
                type: "array",
                items: { type: "string" },
                description: "Filters listings by one or more values for sqft",
              },

              // Year built
              minYearBuilt: {
                type: "string",
                description:
                  "Minimum year built (excludes listings without year)",
              },
              maxYearBuilt: {
                type: "number",
                description:
                  "Maximum year built (excludes listings without year)",
              },
              yearBuilt: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filter listings by one or more values for yearBuilt",
              },

              // Parking parameters
              minParkingSpaces: {
                type: "number",
                description: "Minimum parking spaces",
              },
              maxParkingSpaces: {
                type: "number",
                description: "Maximum parking spaces",
              },
              garage: {
                type: "array",
                items: { type: "string" },
                description: "Filter listings by garage description",
              },
              minGarageSpaces: {
                type: "number",
                description: "Minimum garage spaces",
              },
              driveway: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filters listings by one or more values for driveway",
              },

              // Features and amenities
              amenities: {
                type: "array",
                items: { type: "string" },
                description: "Filter by amenities like 'Gym', 'Swimming Pool'",
              },
              amenitiesOperator: {
                type: "string",
                enum: ["AND", "OR"],
                description:
                  "AND = listing must have all specified amenities; OR = listing must have at least one (default: OR)",
              },
              swimmingPool: {
                type: "array",
                items: { type: "string" },
                description: "Filter listings by swimming pool values",
              },
              balcony: {
                type: "array",
                items: { type: "string" },
                description: "Filters listings by balcony values",
              },
              basement: {
                type: "array",
                items: { type: "string" },
                description: "Filters listings by basement description",
              },
              den: {
                type: "string",
                description: "Filter listings by den description",
              },
              locker: {
                type: "array",
                items: { type: "string" },
                description: "Filters listings by locker values",
              },
              heating: {
                type: "array",
                items: { type: "string" },
                description: "Filters listings by heating values",
              },
              waterSource: {
                type: "array",
                items: { type: "string" },
                description: "Filter listings by water source values",
              },
              sewer: {
                type: "array",
                items: { type: "string" },
                description: "Filters listings by sewer values",
              },
              exteriorConstruction: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filters by exterior construction (matches exteriorConstruction1 and exteriorConstruction2)",
              },
              waterfront: {
                type: "string",
                enum: ["Y", "N"],
                description:
                  "Y = waterfront listings, N = non-waterfront listings",
              },

              // Standard status (RESO standard)
              standardStatus: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "Active",
                    "Active Under Contract",
                    "Canceled",
                    "Closed",
                    "Coming Soon",
                    "Delete",
                    "Expired",
                    "Hold",
                    "Incomplete",
                    "Pending",
                    "Withdrawn",
                  ],
                },
                description: "Filter by RESO standard status values",
              },

              // Status and type
              status: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["A", "U"],
                },
                description:
                  "A = active listings, U = unavailable listings (default: A)",
              },
              lastStatus: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "Sus",
                    "Exp",
                    "Sld",
                    "Ter",
                    "Dft",
                    "Lsd",
                    "Sc",
                    "Sce",
                    "Lc",
                    "Pc",
                    "Ext",
                    "New",
                  ],
                },
                description: "Filter by last status of the listing",
              },
              type: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["sale", "lease"],
                },
                description: "Filter properties for sale or lease",
              },

              // Business properties
              businessType: {
                type: "array",
                items: { type: "string" },
                description: "Filter by business type",
              },
              businessSubType: {
                type: "array",
                items: { type: "string" },
                description: "Filter by business sub-type",
              },

              // MLS and identification
              mlsNumber: {
                type: "array",
                items: { type: "string" },
                description: "Filter listings by one or more MLS numbers",
              },
              boardId: {
                type: "array",
                items: { type: "number" },
                description:
                  "Filter by board ID (required if account has multiple MLS access)",
              },

              // Agent and brokerage
              agent: {
                type: "array",
                items: { type: "string" },
                description: "Filter by agent name or agent ID",
              },
              brokerage: {
                type: "string",
                description: "Filter results by brokerage name",
              },
              officeId: {
                type: "string",
                description:
                  "Filter listings by the office ID of the listing brokerage",
              },
              hasAgents: {
                type: "boolean",
                description:
                  "true = only listings with agents, false = only listings without agents",
              },

              // Price change filters
              lastPriceChangeType: {
                type: "string",
                enum: ["decrease", "increase"],
                description: "Filter listings that had a price decrease or increase",
              },
              minPriceChangeDateTime: {
                type: "string",
                format: "date",
                description: "Listings with a price change on or after this date (YYYY-MM-DD)",
              },
              maxPriceChangeDateTime: {
                type: "string",
                format: "date",
                description: "Listings with a price change on or before this date (YYYY-MM-DD)",
              },

              // Days on market filters (status=U only)
              minDaysOnMarket: {
                type: "number",
                description: "Filter status=U listings with days on market >= this value",
              },
              maxDaysOnMarket: {
                type: "number",
                description: "Filter status=U listings with days on market <= this value",
              },

              // Date filters
              listDate: {
                type: "string",
                format: "date",
                description: "Filter by specific listing date (YYYY-MM-DD)",
              },
              minListDate: {
                type: "string",
                format: "date",
                description:
                  "Listings listed on or after this date (YYYY-MM-DD)",
              },
              maxListDate: {
                type: "string",
                format: "date",
                description:
                  "Listings listed on or before this date (YYYY-MM-DD)",
              },
              minSoldDate: {
                type: "string",
                format: "date",
                description:
                  "Listings sold/leased on or after this date (YYYY-MM-DD)",
              },
              maxSoldDate: {
                type: "string",
                format: "date",
                description:
                  "Listings sold/leased on or before this date (YYYY-MM-DD)",
              },
              updatedOn: {
                type: "string",
                format: "date",
                description: "Filter by specific MLS update date (YYYY-MM-DD)",
              },
              minUpdatedOn: {
                type: "string",
                format: "date",
                description:
                  "Listings updated on or after this date (YYYY-MM-DD)",
              },
              maxUpdatedOn: {
                type: "string",
                format: "date",
                description:
                  "Listings updated on or before this date (YYYY-MM-DD)",
              },
              minUnavailableDate: {
                type: "string",
                format: "date",
                description:
                  "Listings unavailable on or after this date (YYYY-MM-DD)",
              },
              maxUnavailableDate: {
                type: "string",
                format: "date",
                description:
                  "Listings unavailable on or before this date (YYYY-MM-DD)",
              },
              minOpenHouseDate: {
                type: "string",
                format: "date",
                description:
                  "Listings with open house on or after this date (YYYY-MM-DD)",
              },
              maxOpenHouseDate: {
                type: "string",
                format: "date",
                description:
                  "Listings with open house on or before this date (YYYY-MM-DD)",
              },
              minClosedDate: {
                type: "string",
                format: "date",
                description: "Listings with a close date on or after this date (YYYY-MM-DD)",
              },
              maxClosedDate: {
                type: "string",
                format: "date",
                description: "Listings with a close date on or before this date (YYYY-MM-DD)",
              },
              repliersUpdatedOn: {
                type: "string",
                format: "date",
                description:
                  "Filter by specific Repliers internal update date (YYYY-MM-DD)",
              },
              minRepliersUpdatedOn: {
                type: "string",
                format: "date",
                description:
                  "Repliers internal updates on or after this date (YYYY-MM-DD)",
              },
              maxRepliersUpdatedOn: {
                type: "string",
                format: "date",
                description:
                  "Repliers internal updates on or before this date (YYYY-MM-DD)",
              },

              // Display options
              displayAddressOnInternet: {
                type: "string",
                enum: ["Y", "N"],
                description:
                  "Y = address can be displayed, N = address should not be displayed",
              },
              displayInternetEntireListing: {
                type: "string",
                enum: ["Y", "N"],
                description:
                  "Y = can display on internet portals, N = back office only",
              },
              displayPublic: {
                type: "string",
                enum: ["Y", "N"],
                description: "Y = publicly displayable, N = password protected",
              },
              hasImages: {
                type: "boolean",
                description: "Filter listings with/without images",
              },

              // Search parameters
              search: {
                type: "string",
                description: "Keyword search across listing fields",
              },
              searchFields: {
                type: "string",
                description:
                  "Limit keyword search to specific fields (e.g., 'address.streetName')",
              },
              operator: {
                type: "string",
                enum: ["AND", "OR"],
                description:
                  "AND = match all parameters, OR = match at least one (default: AND)",
              },

              // Sorting
              sortBy: {
                type: "string",
                enum: [
                  "createdOnDesc", "createdOnAsc",
                  "updatedOnDesc", "updatedOnAsc",
                  "repliersUpdatedOnDesc", "repliersUpdatedOnAsc",
                  "listPriceDesc", "listPriceAsc",
                  "soldPriceDesc", "soldPriceAsc",
                  "soldDateDesc", "soldDateAsc",
                  "sqftDesc", "sqftAsc",
                  "bedsDesc", "bedsAsc",
                  "bathsDesc", "bathsAsc",
                  "yearBuiltDesc", "yearBuiltAsc",
                  "distanceAsc", "distanceDesc",
                  "random",
                ],
                description:
                  "Sort order (default: updatedOnDesc). Use distanceAsc/Desc with lat/long/radius",
              },

              // Response customization
              fields: {
                type: "string",
                description:
                  "Limit response fields (e.g., 'listPrice,soldPrice' or 'images[5]' for first 5 images)",
              },
              coverImage: {
                type: "string",
                enum: [
                  "kitchen",
                  "powder room",
                  "ensuite",
                  "family room",
                  "exterior front",
                  "backyard",
                  "staircase",
                  "primary bedroom",
                  "laundry room",
                  "office",
                  "garage",
                ],
                description:
                  "AI-powered cover image selection — reorders images so the specified room type appears first. Requires Image Insights subscription upgrade.",
              },

              // Aggregation and clustering
              aggregates: {
                type: "string",
                description: "Aggregate values/counts for specified fields (e.g. 'address.neighborhood', 'address.city')",
              },
              aggregatesUnique: {
                type: "string",
                description: "Unique aggregates for comma-separated value fields",
              },
              aggregateStatistics: {
                type: "boolean",
                description: "Group statistics by aggregates when both used",
              },
              statistics: {
                type: "string",
                description: `Request real-time market statistics. MUST BE USED when user asks for averages, medians, trends, or any statistical calculation.
                              Format: Comma-separated stat codes (NOT raw field names).

                              Valid stat codes:
                              - Price (active or sold): avg-listPrice, med-listPrice, min-listPrice, max-listPrice, sum-listPrice
                              - Sold price (requires status=["U"]): avg-soldPrice, med-soldPrice, min-soldPrice, max-soldPrice, sum-soldPrice
                              - Days on market (requires status=["U"]): avg-daysOnMarket, med-daysOnMarket, min-daysOnMarket, max-daysOnMarket, sd-daysOnMarket
                              - Counts: cnt-available, cnt-new, cnt-closed
                              - Time grouping: grp-mth, grp-yr, grp-day, grp-7-days, grp-30-days, grp-60-days, grp-90-days, grp-180-days, grp-365-days
                              - Other: pct-aboveBelowList (requires status=["U"]), avg-priceSqft, avg-tax, med-tax, min-sqft, max-sqft, avg-maintenanceFee, med-maintenanceFee
                              - Std deviation: sd-listPrice, sd-soldPrice

                              IMPORTANT: Stats involving soldPrice, daysOnMarket, or pct-aboveBelowList require status=["U"] (sold/unavailable listings).

                              Examples:
                              - "median list price" → statistics: "med-listPrice"
                              - "average days on market" → statistics: "avg-daysOnMarket" (+ status: ["U"])
                              - "monthly price trend" → statistics: "grp-mth,med-soldPrice,avg-soldPrice,cnt-closed" (+ status: ["U"])
                              - "price stats by neighborhood" → statistics: "avg-listPrice" + aggregates: "address.neighborhood" + aggregateStatistics: true`,
              },
              cluster: {
                type: "boolean",
                description: "Enable dynamic map clusters",
              },
              clusterFields: {
                type: "string",
                description:
                  "Fields to include in clusters (e.g., 'listPrice,images[5]')",
              },
              clusterLimit: {
                type: "number",
                minimum: 1,
                maximum: 200,
                description:
                  "Limit clusters returned when 'map' in aggregates (1-200)",
              },
              clusterListingsThreshold: {
                type: "number",
                minimum: 1,
                maximum: 100,
                description:
                  "Max cluster size at which individual listings are included in cluster response (1-100)",
              },
              clusterPrecision: {
                type: "number",
                minimum: 0,
                maximum: 29,
                description:
                  "Cluster granularity (0-29, lower = fewer clusters)",
              },
              clusterStatistics: {
                type: "boolean",
                description: "Calculate statistics per cluster",
              },
              listings: {
                type: "boolean",
                description:
                  "Include listings in response (default: true, set false for stats only)",
              },

              // AI features
              nlpQuery: {
                type: "string",
                description: "Natural language query for AI processing",
              },
              // AI Image Search parameters (sent in request body)
              imageSearchItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["image", "text"],
                      description:
                        "Input type - 'image' for image URLs or 'text' for text descriptions",
                    },
                    url: {
                      type: "string",
                      description: "Image URL (required when type='image')",
                    },
                    value: {
                      type: "string",
                      description:
                        "Text description (required when type='text')",
                    },
                    boost: {
                      type: "integer",
                      description:
                        "Importance weight (higher = more important)",
                    },
                  },
                  required: ["type"],
                  description:
                    "AI image search item - provide either image URL or text description",
                },
                description:
                  "AI-powered image search criteria (sent in request body, triggers POST method)",
              },
            },
          },
          pageNum: {
            type: "number",
            minimum: 1,
            description: "Page number for pagination (default: 1)",
          },
          resultsPerPage: {
            type: "number",
            minimum: 1,
            maximum: 100,
            description: "Number of results per page (default: 10, max: 100). Keep low when you only need stats (listings: false). Set higher when returning listings to the user.",
          },
        },
        required: [],
      },
    },
  },
};

export { repliersListingsSearchTool };
