/**
 * Repliers AI-Powered NLP Search Tool
 *
 * Two-step process:
 *   1. POST /nlp  — translates a natural language prompt into a structured
 *                   listings URL (and optional imageSearchItems body).
 *   2. GET/POST /listings — executes that generated URL to fetch real results.
 *
 * Supports conversational context via nlpId so follow-up prompts refine
 * the previous search rather than starting from scratch.
 *
 * Note: requires NLP to be enabled on the Repliers account (contact support).
 */

import { repliersGet, repliersPost } from "../../../lib/api-client.js";

const executeFunction = async (args) => {
  // ── Step 1: Translate prompt → structured query ──────────────────────────
  const nlpUrl = new URL("https://api.repliers.io/nlp");
  const nlpBody = { prompt: args.prompt };
  if (args.nlpId) nlpBody.nlpId = args.nlpId;

  const nlpResult = await repliersPost(nlpUrl, nlpBody);
  if (nlpResult.error) {
    return { error: `NLP translation failed: ${nlpResult.error}`, details: nlpResult.details };
  }

  const { request, nlpId } = nlpResult.data;

  // ── Step 2: Execute the generated listings query ─────────────────────────
  const listingsUrl = new URL(request.url);

  if (args.pageNum !== undefined) {
    listingsUrl.searchParams.set("pageNum", String(args.pageNum));
  }
  const defaultRpp = parseInt(process.env.RESULTS_PER_PAGE) || 10;
  listingsUrl.searchParams.set("resultsPerPage", String(args.resultsPerPage ?? defaultRpp));

  const hasBody = request.body && Object.keys(request.body).length > 0;
  const listingsResult = hasBody
    ? await repliersPost(listingsUrl, request.body)
    : await repliersGet(listingsUrl);

  if (listingsResult.error) {
    return {
      nlpId,
      translatedUrl: listingsUrl.toString(),
      summary: request.summary,
      error: listingsResult.error,
      details: listingsResult.details,
    };
  }

  return {
    nlpId,
    translatedUrl: listingsUrl.toString(),
    summary: request.summary,
    data: listingsResult.data,
  };
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "nlp_search",
      description:
        "Search for real estate listings using natural language. Translates a plain-English prompt into a structured Repliers API query and returns matching listings. Supports conversational follow-ups via nlpId — pass the nlpId returned from a previous call to refine that search (e.g. 'also make it under $800k'). Handles visual/aesthetic preferences (e.g. 'modern kitchen', 'bright living room') by triggering AI image search automatically.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description:
              "Natural language description of what the user is looking for. Examples: 'Find me a 3 bedroom house in Corso Italia under $1.5M with a finished basement', 'Condo in downtown Toronto with a rooftop terrace and modern kitchen'",
          },
          nlpId: {
            type: "string",
            description:
              "Optional. The nlpId returned from a previous nlp_search call. Pass this to refine the previous search with a follow-up prompt (e.g. 'also needs 2 parking spots'). Omit for a fresh search.",
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
            description: "Number of results per page (default: 10, max: 100)",
          },
        },
        required: ["prompt"],
      },
    },
  },
};

export { apiTool };
