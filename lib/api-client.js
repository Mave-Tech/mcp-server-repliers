/**
 * Shared Repliers API client.
 *
 * Provides helpers for authenticated fetch calls so tool files don't each
 * need to duplicate the apiKey lookup, header building, and error parsing.
 */

export const BASE_URL = "https://api.repliers.io";

/** Returns the API key from the environment, throwing if absent. */
function getApiKey() {
  const apiKey = process.env.REPLIERS_API_KEY;
  if (!apiKey) throw new Error("REPLIERS_API_KEY environment variable is not set");
  return apiKey;
}

/**
 * Appends params to a URL object.
 * Arrays are serialized as repeated keys; everything else as a single value.
 */
export function appendParams(url, params) {
  if (!params) return;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
}

/**
 * Parses a fetch Response into a standard result shape:
 *   { url, status, data }        on success
 *   { url, status, error, details } on HTTP error
 */
async function parseResponse(response, url) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      url,
      status: response.status,
      error: errorData.error || `API request failed (${response.status})`,
      details: errorData,
    };
  }
  const data = await response.json();
  return { url, status: response.status, data };
}

/**
 * Authenticated GET request.
 * @param {URL} url
 */
export async function repliersGet(url) {
  const finalUrl = url.toString();
  try {
    const response = await fetch(finalUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "REPLIERS-API-KEY": getApiKey(),
      },
    });
    return parseResponse(response, finalUrl);
  } catch (error) {
    return { url: finalUrl, error: "Network or processing error", details: error.message };
  }
}

/**
 * Authenticated POST request.
 * @param {URL} url
 * @param {object|null} body  JSON body (omit or pass null for no body)
 */
export async function repliersPost(url, body = null) {
  const finalUrl = url.toString();
  try {
    const headers = {
      Accept: "application/json",
      "REPLIERS-API-KEY": getApiKey(),
    };
    if (body) headers["Content-Type"] = "application/json";

    const response = await fetch(finalUrl, {
      method: "POST",
      headers,
      ...(body && { body: JSON.stringify(body) }),
    });
    return parseResponse(response, finalUrl);
  } catch (error) {
    return { url: finalUrl, error: "Network or processing error", details: error.message };
  }
}

/**
 * Injects a _metadata block into a paginated result's data field.
 * Safe to call on error results — returns them unchanged.
 */
export function withMetadata(result, pageNum, rpp) {
  if (!result.data) return result;
  const d = result.data;
  return {
    ...result,
    data: {
      ...d,
      _metadata: {
        totalResults: d.count || 0,
        totalPages: d.numPages || 0,
        currentPage: d.page || pageNum || 1,
        resultsPerPage: d.pageSize || rpp,
      },
    },
  };
}
