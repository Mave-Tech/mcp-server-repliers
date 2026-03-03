/**
 * Repliers NLP History Tools
 *
 * Two tools for browsing past NLP search activity:
 *
 * get_nlp_prompts  — GET /nlp        — list/filter individual prompts
 * get_nlp_sessions — GET /nlp/chats  — list/filter NLP sessions (each session
 *                                       can have many prompts, identified by nlpId)
 *
 * Most useful after nlp_search has been used to build up history, or to resume
 * a previous NLP conversation by retrieving its nlpId.
 */

import { BASE_URL, repliersGet, appendParams } from "../../../lib/api-client.js";

const executeGetNlpPrompts = async (args) => {
  const url = new URL(`${BASE_URL}/nlp`);
  appendParams(url, {
    nlpId: args.nlpId,
    clientId: args.clientId,
    pageNum: args.pageNum,
    resultsPerPage: args.resultsPerPage,
  });
  return repliersGet(url);
};

const executeGetNlpSessions = async (args) => {
  const url = new URL(`${BASE_URL}/nlp/chats`);
  appendParams(url, {
    nlpId: args.nlpId,
    clientId: args.clientId,
    prompts: args.prompts,
    pageNum: args.pageNum,
    resultsPerPage: args.resultsPerPage,
  });
  return repliersGet(url);
};

const nlpPromptsTool = {
  function: executeGetNlpPrompts,
  definition: {
    type: "function",
    function: {
      name: "get_nlp_prompts",
      description:
        "List and filter past NLP search prompts. Each prompt is an individual natural language query submitted via nlp_search. Filter by nlpId to see all prompts in a specific session, or by clientId to see prompts for a specific client.",
      parameters: {
        type: "object",
        properties: {
          nlpId: {
            type: "string",
            description: "Filter prompts to a specific NLP session",
          },
          clientId: {
            type: "string",
            description: "Filter prompts associated with a specific client",
          },
          pageNum: {
            type: "number",
            minimum: 1,
            description: "Page number (default: 1)",
          },
          resultsPerPage: {
            type: "number",
            minimum: 1,
            maximum: 100,
            description: "Results per page (default: 100, max: 100)",
          },
        },
        required: [],
      },
    },
  },
};

const nlpSessionsTool = {
  function: executeGetNlpSessions,
  definition: {
    type: "function",
    function: {
      name: "get_nlp_sessions",
      description:
        "List and filter past NLP search sessions. Each session (identified by nlpId) can contain multiple prompts. Use prompts=true to include the full prompt history for each session. Useful for resuming a previous NLP conversation by finding its nlpId.",
      parameters: {
        type: "object",
        properties: {
          nlpId: {
            type: "string",
            description: "Filter to a specific session by nlpId",
          },
          clientId: {
            type: "string",
            description: "Filter sessions for a specific client",
          },
          prompts: {
            type: "boolean",
            description: "Include all prompts for each session (default: false)",
          },
          pageNum: {
            type: "number",
            minimum: 1,
            description: "Page number (default: 1)",
          },
          resultsPerPage: {
            type: "number",
            minimum: 1,
            maximum: 100,
            description: "Results per page (default: 100, max: 100)",
          },
        },
        required: [],
      },
    },
  },
};

export { nlpPromptsTool, nlpSessionsTool };
