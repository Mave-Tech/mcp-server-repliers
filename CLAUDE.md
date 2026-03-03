# Repliers MCP Server — CLAUDE.md

## Project Overview

This is an MCP (Model Context Protocol) server that wraps the **Repliers real estate API**, giving AI assistants (Claude Desktop, Postman AI, etc.) natural-language access to Canadian/US MLS real estate data. It exposes 8 tools covering property search, listing lookup, address history, buildings, location metadata, and deleted listings.

- **Base API**: `https://api.repliers.io`
- **Auth header**: `REPLIERS-API-KEY: <key>`
- **Required env var**: `REPLIERS_API_KEY`
- **Optional env var**: `RESULTS_PER_PAGE` (default: 20 for search, 100 for buildings)
- **Node requirement**: v22+ (v18+ minimum)
- **Package manager**: npm
- **Module system**: ESM (`"type": "module"`)

---

## Architecture

```
index.js                  ← CLI entry point (uses commander)
mcpServer.js              ← MCP server (stdio or SSE transport)
lib/tools.js              ← Tool discovery: dynamically imports all tool files
tools/paths.js            ← Ordered list of tool file paths
commands/tools.js         ← CLI "tools" command: lists all tools with descriptions
tools/repliers/
  repliers-api/
    search.js                         → repliers_listings_search
    get-a-listing.js                  → get_listing
    find-similar-listings.js          → find_similar_listings
    get-address-history.js            → get_address_history
    buildings.js                      → repliers_buildings_search
    areas-cities-and-neighborhoods.js → list_locations
    property-types-styles.js          → list_property_types_and_styles
    get-deleted-listings.js           → get_deleted_listings
```

### Tool Module Format

Every tool file exports either `apiTool` or `repliersListingsSearchTool` (the search tool uses the latter name). Each export has the shape:

```js
{
  function: async (args) => { ... },   // executes the API call
  definition: {
    type: "function",
    function: {
      name: "tool_name",
      description: "...",
      parameters: { type: "object", properties: {...}, required: [...] }
    }
  }
}
```

`lib/tools.js` spreads both export names onto each module object, so `discoverTools()` can handle both naming conventions uniformly.

### Transport Modes

- **stdio** (default): Used by Claude Desktop and Postman STDIO. Run with `node mcpServer.js`.
- **SSE**: HTTP server on port 3001 (or `PORT` env). Run with `node mcpServer.js --sse`. Endpoints: `GET /sse` (connect) and `POST /messages?sessionId=...` (send).

### Response Format

Every tool call returns two content blocks:
1. `🔗 API Endpoint Used` — the full URL that was called
2. The JSON response data (stringified)

---

## All MCP Tools

### 1. `repliers_listings_search`
**File**: `tools/repliers/repliers-api/search.js`
**Endpoint**: `GET /listings` (or `POST /listings` when `map` or `imageSearchItems` are provided)

The primary search tool. All params go under a `params` object plus top-level pagination.

**Top-level parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `params` | object | Search filter object (all filters below) |
| `pageNum` | number | Page number (default: 1) |
| `resultsPerPage` | number | 1–100, default from env or 20 |

**Key `params` categories:**

- **Location**: `city[]`, `state[]`, `area`, `areaOrCity[]`, `neighborhood[]`, `district`, `zip`, `zoning`
- **Address**: `streetName`, `streetNumber`, `minStreetNumber`, `maxStreetNumber`, `streetDirection[]`, `streetSuffix[]`, `unitNumber[]`
- **Geographic**: `lat`, `long`, `radius` (km), `map` (GeoJSON polygon → triggers POST), `mapOperator` (OR/AND)
- **Price**: `minPrice`, `maxPrice`, `minSoldPrice`, `maxSoldPrice`, `minMaintenanceFee`, `maxMaintenanceFee`, `minTaxes`, `maxTaxes`
- **Property**: `propertyType[]`, `propertyTypeOrStyle[]`, `class[]` (condo/residential/commercial), `style[]`
- **Rooms**: `minBedrooms`, `maxBedrooms`, `minBedroomsPlus`, `maxBedroomsPlus`, `minBedroomsTotal`, `maxBedroomsTotal`, `minBaths`, `maxBaths`, `minKitchens`, `maxKitchens`
- **Size**: `minSqft`, `maxSqft`, `sqft[]`
- **Year Built**: `minYearBuilt`, `maxYearBuilt`, `yearBuilt[]`
- **Parking**: `minParkingSpaces`, `garage[]`, `minGarageSpaces`, `driveway[]`
- **Features**: `amenities[]`, `swimmingPool[]`, `balcony[]`, `basement[]`, `den`, `locker[]`, `heating[]`, `waterSource[]`, `sewer[]`, `exteriorConstruction[]`, `waterfront` (Y/N)
- **Status/Type**: `status[]` (A=active, U=unavailable), `lastStatus[]` (Sus/Exp/Sld/Ter/Dft/Lsd/Sc/Sce/Lc/Pc/Ext/New), `type[]` (sale/lease)
- **Business**: `businessType[]`, `businessSubType[]`
- **MLS**: `mlsNumber[]`, `boardId[]`
- **Agent/Brokerage**: `agent[]`, `brokerage`, `officeId`, `hasAgents` (boolean)
- **Dates** (all YYYY-MM-DD): `listDate`, `minListDate`, `maxListDate`, `minSoldDate`, `maxSoldDate`, `updatedOn`, `minUpdatedOn`, `maxUpdatedOn`, `minUnavailableDate`, `maxUnavailableDate`, `minOpenHouseDate`, `maxOpenHouseDate`, `repliersUpdatedOn`, `minRepliersUpdatedOn`, `maxRepliersUpdatedOn`
- **Display**: `displayAddressOnInternet` (Y/N), `displayInternetEntireListing` (Y/N), `displayPublic` (Y/N), `hasImages` (boolean)
- **Search**: `search` (keyword), `searchFields`, `operator` (AND/OR)
- **Sorting**: `sortBy` (default: `updatedOnDesc`; use `distanceAsc`/`distanceDesc` with lat/long)
- **Response shaping**: `fields` (e.g. `"listPrice,soldPrice"` or `"images[5]"`), `coverImage` (image/text)
- **Aggregation**: `aggregates`, `aggregateStatistics` (boolean), `statistics` (comma-separated fields like `"listPrice,daysOnMarket"` → returns min/max/avg/median/sum/count), `listings` (boolean, set false for stats-only)
- **Clustering**: `cluster` (boolean), `clusterFields`, `clusterLimit` (1–200), `clusterPrecision` (0–29), `clusterStatistics`
- **AI features**: `nlpQuery` (natural language), `imageSearchItems[]` (AI image search, triggers POST)

> **Statistics note**: Use `statistics` param whenever user asks for averages, medians, min/max, or any aggregate calculation.

> **POST trigger**: `map` or `imageSearchItems` automatically switches to POST with those params in the request body.

---

### 2. `get_listing`
**File**: `tools/repliers/repliers-api/get-a-listing.js`
**Endpoint**: `GET /listings/{mlsNumber}`

| Param | Required | Description |
|-------|----------|-------------|
| `mlsNumber` | yes | MLS number of the listing |
| `boardId` | no | Required only if account has multiple MLS access |

---

### 3. `find_similar_listings`
**File**: `tools/repliers/repliers-api/find-similar-listings.js`
**Endpoint**: `GET /listings/{mlsNumber}/similar`

| Param | Required | Description |
|-------|----------|-------------|
| `mlsNumber` | yes | MLS number of the reference listing |
| `boardId[]` | no | One or more board IDs |
| `fields` | no | Limit response fields (e.g. `"listPrice,soldPrice"` or `"images[5]"`) |
| `listPriceRange` | no | +/- price range in dollars (e.g. `250000`) |
| `radius` | no | Radius in km |
| `sortBy` | no | `updatedOnDesc` / `updatedOnAsc` / `createdOnAsc` / `createdOnDesc` |

---

### 4. `get_address_history`
**File**: `tools/repliers/repliers-api/get-address-history.js`
**Endpoint**: `GET /listings` (with address filters)

Returns all historical MLS listings for a specific address.

| Param | Required | Description |
|-------|----------|-------------|
| `city` | yes | City name |
| `streetName` | yes | Street name (e.g. `"Yonge"`, no suffix/direction) |
| `streetNumber` | yes | Street number |
| `zip` | yes | Postal/zip code |
| `unitNumber` | no | Unit number |
| `streetSuffix` | no | e.g. `"St"`, `"Ave"` |
| `streetDirection` | no | e.g. `"N"`, `"W"` |

---

### 5. `repliers_buildings_search`
**File**: `tools/repliers/repliers-api/buildings.js`
**Endpoint**: `GET /listings/buildings`

Returns building/complex-level data (not individual units). Always GET; `map` is JSON-stringified as a query param.

**Top-level parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `params` | object | Filter object |
| `pageNum` | number | Page number (default: 1) |
| `resultsPerPage` | number | 1–100, default 100 |

**`params` properties:**
| Param | Description |
|-------|-------------|
| `city[]` | Filter by cities |
| `neighborhood[]` | Filter by neighborhoods |
| `map` | GeoJSON polygon (auto JSON-stringified) |
| `class[]` | condo / residential / commercial |
| `minPrice`, `maxPrice` | Price range for units |
| `minBeds`, `maxBeds` | Bedroom range for units |
| `propertyType[]` | Property types |
| `type` | `"Sale"` or `"Lease"` |
| `streetName` | Building street name |
| `streetNumber` | Building street number |
| `sortBy` | `"numUnitsDesc"` |
| `displayPublic` | `"Y"` or `"N"` |

---

### 6. `list_locations`
**File**: `tools/repliers/repliers-api/areas-cities-and-neighborhoods.js`
**Endpoint**: `GET /listings/locations`

All parameters optional; returns hierarchical area/city/neighborhood data.

| Param | Description |
|-------|-------------|
| `area` | Filter to matching areas |
| `city` | Filter to matching cities |
| `class` | Filter by listing class |
| `neighborhood` | Filter to matching neighborhoods |
| `search` | Partial-match search across all three levels |

---

### 7. `list_property_types_and_styles`
**File**: `tools/repliers/repliers-api/property-types-styles.js`
**Endpoint**: `GET /listings/property-types`

No parameters. Returns the full reference list of property types and architectural styles available.

---

### 8. `get_deleted_listings`
**File**: `tools/repliers/repliers-api/get-deleted-listings.js`
**Endpoint**: `GET /listings/deleted`

All three date parameters are marked required in the tool definition (all YYYY-MM-DD strings).

| Param | Description |
|-------|-------------|
| `updatedOn` | Exact update date |
| `minUpdatedOn` | Range start date |
| `maxUpdatedOn` | Range end date |

---

## All MCP Tools (Current — 11 tools)

| Tool | Endpoint | Status |
|------|----------|--------|
| `repliers_listings_search` | `GET/POST /listings` | Working |
| `get_listing` | `GET /listings/{mlsNumber}` | Working |
| `find_similar_listings` | `GET /listings/{mlsNumber}/similar` | Working |
| `get_address_history` | `GET /listings` (address filters) | Working |
| `repliers_buildings_search` | `GET /listings/buildings` | Working |
| `list_locations` | `GET /listings/locations` | Working |
| `list_property_types_and_styles` | `GET /listings/property-types` | Working |
| `get_deleted_listings` | `GET /listings/deleted` | Working (may be tier-gated) |
| `nlp_search` | `POST /nlp` | 403 — needs OpenAI key in Repliers portal |
| `get_places` | `GET /places` | Working — HoodQ/neighbourhood data |
| `locations_autocomplete` | `GET /locations/autocomplete` | Working |

### Other API endpoints discovered (not yet implemented)
- `GET /brokerages` — brokerage list (sparse: name + office IDs only)
- `POST/GET /estimates` — property valuations (403, account gated)
- `GET /members` — member directory (403, account gated)
- `POST/GET/PATCH/DELETE /agents` — agent CRM (not relevant for search use case)
- `POST/GET/PATCH/DELETE /clients` — client CRM (not relevant for search use case)
- `POST/GET /saved-searches` — saved search management
- `POST /subscriptions` — webhooks

---

## Bugs Found in Tool Definitions (vs. Actual API Behavior)

### Bug 1: `repliers_buildings_search` — `type` enum case mismatch
- **Tool definition says**: `enum: ["Sale", "Lease"]`
- **API actually expects**: `"sale"` or `"lease"` (lowercase)
- Passing `"Sale"` returns a 400 error: `"must be one of [sale, lease]"`
- **Fix**: change enum values to lowercase in `buildings.js`

### Bug 2: `repliers_listings_search` — `statistics` param description is wrong
- **Tool description says**: pass field names like `"listPrice,daysOnMarket"`
- **API actually expects**: pre-defined stat codes (see correct format below)
- Passing raw field names returns a 400 error listing valid values

#### Correct `statistics` values (confirmed by API error message):
```
avg-tax, med-tax
grp-7-days, grp-30-days, grp-60-days, grp-90-days, grp-180-days, grp-365-days
grp-yr, grp-mth, grp-day            ← grouping/bucketing by time period
pct-aboveBelowList                  ← % above/below list price
avg-priceSqft                       ← avg price per sqft
cnt-available, cnt-new, cnt-closed  ← count stats
sd-daysOnMarket, sd-listPrice, sd-soldPrice   ← standard deviation
med-daysOnMarket, med-soldPrice, med-listPrice
avg-daysOnMarket, sum-daysOnMarket, min-daysOnMarket, max-daysOnMarket
avg-listPrice, sum-listPrice, min-listPrice, max-listPrice
avg-soldPrice, sum-soldPrice, min-soldPrice, max-soldPrice
avg-maintenanceFee, med-maintenanceFee
avg-maintenanceFeePerSqft, med-maintenanceFeePerSqft
min-sqft, max-sqft
```

#### Important constraint on stats:
Statistics involving `daysOnMarket`, `soldPrice`, or `pct-aboveBelowList` require `status: ["U"]` (unavailable/sold listings), not `status: ["A"]`. Using them with active listings returns a 400.

---

## Real API Behavior (Confirmed by Testing)

### Search response structure
```json
{
  "apiVersion": 2,
  "page": 1,
  "numPages": 698,
  "pageSize": 3,
  "count": 2094,
  "statistics": { "listPrice": { "min": 0, "max": 800000 } },
  "listings": [ ... ]
}
```
Note: the response always includes a basic `statistics.listPrice.{min,max}` even without requesting statistics.

### Listing object key fields
Each listing has:
- `mlsNumber`, `status` (A/U), `class` (CondoProperty/ResidentialProperty/CommercialProperty), `type` (Sale/Lease)
- `listPrice`, `soldPrice`, `originalPrice`, `listDate`, `soldDate`, `lastStatus`
- `address` — full address including `area`, `city`, `neighborhood`, `district`, `zip`, `state`, `majorIntersection`, `addressKey`
- `map` — `{ latitude, longitude, point, placeId }`
- `permissions` — `{ displayAddressOnInternet, displayPublic, displayInternetEntireListing }`
- `images` — array of image filenames like `"IMG-W12832556_1.jpg"`
- `photoCount`
- `details` — full property details (airConditioning, basement, parking, etc.)

### Statistics with monthly grouping (working example)
```js
{
  params: {
    city: ["Toronto"],
    type: ["sale"],
    status: ["U"],
    lastStatus: ["Sld"],
    minSoldDate: "2025-09-01",
    statistics: "grp-mth,med-soldPrice,avg-soldPrice,cnt-closed",
    listings: false,
  }
}
```
Returns a `statistics.soldPrice.mth` object keyed by `"2025-09"`, `"2025-10"`, etc., each with `avg`, `med`, `count`.

### Neighborhood aggregation (working example)
```js
{
  params: {
    city: ["Toronto"],
    type: ["sale"],
    status: ["A"],
    aggregates: "address.neighborhood",
    statistics: "avg-listPrice",
    aggregateStatistics: true,
    listings: false,
  }
}
```
Returns `statistics.listPrice.aggregates.address.neighborhood` with per-neighborhood count and avg.

### Fields filter behavior
- `fields: "mlsNumber,listPrice,address,images[3]"` returns only those fields
- `images[N]` limits the images array to N items
- Works exactly as documented

### `find_similar_listings` notes
- Returns empty (`count: 0, similar: []`) for brand-new listings (just listed today)
- Works for listings that have been on market a few days or are sold
- Returns up to 20 similar listings by default
- Uses `similar` array key (not `listings`)

### `get_address_history` notes
- Hits `GET /listings` with address as filters (not a dedicated endpoint)
- Returns the standard search response format — all historical MLS records for that address

### `list_locations` response structure
- When called without params: uses `search` key with `{ areas, cities, neighborhoods }` arrays
- When called with `area` + `class`: returns `boards[]` with full hierarchical data including GeoJSON polygon coordinates for each city/neighborhood — the response can be 75,000+ lines for Toronto
- Each city object includes `activeCount`, `lat/lng`, `state`, and full GeoJSON `coordinates`

### `get_deleted_listings` notes
- The endpoint exists at `/listings/deleted`
- The tool passes all three date params (`updatedOn`, `minUpdatedOn`, `maxUpdatedOn`) regardless of which are provided
- Testing returned empty results for various date ranges — may be account/tier restricted

### `repliers_buildings_search` response structure
- Returns `multiUnit` array (not `listings`)
- Each building has: `address`, `map`, `condominium` (condoCorp, condoCorpNum, propertyMgr), `image`, and `sale`/`lease` with count and price range

---

## Setup & Running

```sh
# Install dependencies
npm install

# Create .env
echo "REPLIERS_API_KEY=your-key-here" > .env

# List available tools (CLI)
node index.js tools

# Run as stdio MCP server (Claude Desktop / Postman)
node mcpServer.js

# Run as SSE HTTP server (port 3001 by default)
node mcpServer.js --sse

# Docker build
docker build -t repliers-mcp .
```

### Claude Desktop Config

```json
{
  "mcpServers": {
    "repliers": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/mcpServer.js"],
      "env": {
        "REPLIERS_API_KEY": "your-repliers-api-key"
      }
    }
  }
}
```

---

## Key Implementation Details

### Tool Discovery (`lib/tools.js`)
`discoverTools()` iterates `toolPaths` from `tools/paths.js`, dynamically imports each module, and merges `apiTool` and `repliersListingsSearchTool` exports onto the same object. The `search.js` tool uses `repliersListingsSearchTool` (not `apiTool`).

### Parameter Routing in Search Tool
- Most params → URL query string (GET)
- `map` array → request body as JSON (POST)
- `imageSearchItems` array → request body as JSON (POST)
- `pageNum`, `resultsPerPage` → query string regardless

### Response Metadata
The search and buildings tools inject a `_metadata` object into the response data:
```json
{
  "totalResults": 150,
  "totalPages": 8,
  "currentPage": 1,
  "resultsPerPage": 20
}
```

### Error Handling
- `mcpServer.js` validates `REPLIERS_API_KEY` at startup — exits if missing
- Tool-level errors return `{ error, details, url }` (don't throw to MCP layer)
- Server-level unknown tool → `McpError(MethodNotFound)`
- Server-level missing required param → `McpError(InvalidParams)`

### Adding a New Tool

1. Create `tools/repliers/repliers-api/my-tool.js` exporting `apiTool`
2. Add the path to `tools/paths.js`
3. No other changes needed — discovery is automatic

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.9.0 | MCP server protocol |
| `express` | ^5.1.0 | SSE HTTP transport |
| `dotenv` | ^16.4.7 | `.env` loading |
| `commander` | ^13.1.0 | CLI (`node index.js tools`) |
