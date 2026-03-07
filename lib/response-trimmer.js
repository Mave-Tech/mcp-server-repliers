/**
 * Response trimmer for Repliers MCP server.
 *
 * Problem: Raw Repliers API responses can be 65KB+ per query (8KB per listing × 100 listings).
 * LLMs waste tokens processing rooms[], agents[], images[], permissions, timestamps, etc.
 *
 * Solution: Strip each listing down to the fields that actually matter for real estate analysis,
 * while preserving statistics and metadata in full.
 */

// Fields to keep on each listing object (dot notation = nested)
const LISTING_KEEP_FIELDS = new Set([
  'mlsNumber',
  'listPrice',
  'soldPrice',
  'originalPrice',
  'listDate',
  'soldDate',
  'lastStatus',
  'status',
  'type',
  'class',
  'daysOnMarket',
  'simpleDaysOnMarket',
]);

// Nested objects to keep (with specific sub-fields)
const NESTED_KEEP = {
  address: ['streetNumber', 'streetName', 'streetSuffix', 'streetDirection',
            'unitNumber', 'city', 'area', 'neighborhood', 'district',
            'zip', 'state', 'country'],
  details: ['numBedrooms', 'numBedroomsPlus', 'numBathrooms', 'numBathroomsHalf',
            'numKitchens', 'sqft', 'style', 'propertyType', 'numParkingSpaces',
            'numGarageSpaces', 'numStories', 'yearBuilt', 'basement1',
            'exteriorConstruction1', 'heating', 'den', 'locker'],
  lot:     ['width', 'depth', 'acres', 'squareFeet'],
  map:     ['latitude', 'longitude'],
  taxes:   ['annualAmount'],
  office:  ['brokerageName'],
};

// Max images to include (just the first URL for reference)
const MAX_IMAGES = 1;

function trimListing(listing) {
  if (!listing || typeof listing !== 'object') return listing;

  const trimmed = {};

  // Copy top-level scalar fields
  for (const field of LISTING_KEEP_FIELDS) {
    if (listing[field] !== undefined && listing[field] !== null) {
      trimmed[field] = listing[field];
    }
  }

  // Copy nested objects with sub-field filtering
  for (const [key, subFields] of Object.entries(NESTED_KEEP)) {
    if (listing[key] && typeof listing[key] === 'object') {
      const nested = {};
      for (const sf of subFields) {
        if (listing[key][sf] !== undefined && listing[key][sf] !== null) {
          nested[sf] = listing[key][sf];
        }
      }
      if (Object.keys(nested).length > 0) {
        trimmed[key] = nested;
      }
    }
  }

  // Include maintenance fee if present
  if (listing.condominium?.fees?.maintenance) {
    trimmed.maintenanceFee = listing.condominium.fees.maintenance;
  }

  // Include first image only
  if (Array.isArray(listing.images) && listing.images.length > 0) {
    trimmed.imageCount = listing.images.length;
  }

  return trimmed;
}

/**
 * Trim a Repliers API response to reduce token usage.
 * Preserves statistics and metadata in full; trims listing objects.
 */
export function trimResponse(data) {
  if (!data || typeof data !== 'object') return data;

  const trimmed = { ...data };

  // Trim listings array
  if (Array.isArray(trimmed.listings)) {
    trimmed.listings = trimmed.listings.map(trimListing);
  }

  // Trim building results (multiUnit)
  if (Array.isArray(trimmed.multiUnit)) {
    trimmed.multiUnit = trimmed.multiUnit.map(building => {
      if (!building || typeof building !== 'object') return building;
      const { nearby, ...rest } = building; // drop nearby (large)
      return rest;
    });
  }

  // Remove the raw URL echo if present at top level
  // (the MCP server already includes it as a separate content block)
  delete trimmed.url;

  return trimmed;
}
