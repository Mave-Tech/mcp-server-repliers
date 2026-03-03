/**
 * Repliers Places / HoodQ Tool
 *
 * GET /places — returns nearby schools (with SchoolQ scores and Fraser Institute
 * ratings), parks, transit stops, and safety places for a given lat/long.
 *
 * Typical usage: get lat/long from a listing's map.latitude / map.longitude,
 * then call this tool to enrich the listing with neighbourhood context.
 */

import { BASE_URL, repliersGet } from "../../../lib/api-client.js";

const summarizeSchool = (s) => ({
  name: s.name,
  type: s.type,
  gradeLevel: s.grade_level,
  gradesOffered: s.grades_offered,
  schoolBoard: s.school_board,
  language: s.language,
  specialPrograms: s.special_programs,
  schoolQScore: s.features?.["SchoolQ Score"],
  fraserRating: s.features?.["Most Recent Rating"],
  fraserRank: s.features?.["Most Recent Rank"],
  address: s.features?.["Address"],
  phone: s.features?.["Phone Number"],
  url: s.url,
  distance: s.distance,
  point: s.point,
  hasCatchment: s.has_catchment,
});

const summarizePark = (p) => ({
  name: p.name,
  description: p.description,
  facilities: p.facilities,
  majorPark: p.major_park,
  address: p.features?.["Address"],
  phone: p.phone_number,
  distance: p.distance,
  point: p.point,
});

const summarizePlace = (p) => ({
  name: p.name,
  type: p.place_type,
  address: p.features?.["Address"] || p.address,
  distance: p.distance,
  point: p.point,
});

const executeFunction = async (args) => {
  const url = new URL(`${BASE_URL}/places`);
  url.searchParams.set("lat", String(args.lat));
  url.searchParams.set("long", String(args.long));

  const result = await repliersGet(url);
  if (result.error || !result.data) return result;

  // Summarize each category — full geometry arrays are large and not useful to an LLM
  const d = result.data;
  return {
    url: result.url,
    data: {
      schools: (d.schools || []).map(summarizeSchool),
      parks: (d.parks || []).map(summarizePark),
      transitStops: (d.transit_stops || []).map(summarizePlace),
      safetyPlaces: (d.safety_places || []).map(summarizePlace),
    },
  };
};

const apiTool = {
  function: executeFunction,
  definition: {
    type: "function",
    function: {
      name: "get_places",
      description:
        "Get neighbourhood context for a location: nearby schools (with SchoolQ scores and Fraser Institute ratings/rankings), parks (with facilities), transit stops, and safety places (police, fire, hospitals). Distances are in kilometres. Pass the lat/long from any listing's map.latitude and map.longitude fields. Essential for answering questions about school quality, walkability, transit access, or neighbourhood amenities near a property.",
      parameters: {
        type: "object",
        properties: {
          lat: {
            type: "number",
            description:
              "Latitude of the location (available as map.latitude on any listing)",
          },
          long: {
            type: "number",
            description:
              "Longitude of the location (available as map.longitude on any listing)",
          },
        },
        required: ["lat", "long"],
      },
    },
  },
};

export { apiTool };
