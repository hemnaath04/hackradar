import type { RawHackathon } from "./types";

const US_STATE_ABBR = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

const US_STATE_NAMES = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
  "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
  "minnesota","mississippi","missouri","montana","nebraska","nevada",
  "new hampshire","new jersey","new mexico","new york","north carolina",
  "north dakota","ohio","oklahoma","oregon","pennsylvania","rhode island",
  "south carolina","south dakota","tennessee","texas","utah","vermont",
  "virginia","washington","west virginia","wisconsin","wyoming",
];

// Greater Boston + Massachusetts campuses a Boston-based hacker would travel to.
// Matched as whole words (see deriveTags) so short tokens like "olin" don't
// hit substrings such as "carolina".
const BOSTON_TERMS = [
  // Boston metro
  "boston","cambridge","somerville","brookline","medford","allston","brighton",
  "back bay","seaport","mit","harvard","northeastern","tufts","brandeis",
  "quincy","newton","waltham","watertown","malden","everett",
  // Wider MA campuses (commutable / regional hackathons)
  "worcester","wpi","lowell","amherst","umass","wellesley","babson","olin",
  "massachusetts",
];

const BOSTON_RE = new RegExp(`\\b(${BOSTON_TERMS.join("|")})\\b`, "i");

export interface DerivedTags {
  isOnline: boolean;
  isBoston: boolean;
  isUsa: boolean;
}

export function deriveTags(raw: RawHackathon): DerivedTags {
  const loc = (raw.location ?? "").toLowerCase().trim();

  const isOnline =
    /online|virtual|remote|anywhere|worldwide|global/.test(loc) ||
    loc === "";

  // Whole-word match, plus the ", MA" / " MA" state-abbreviation form.
  const isBoston = BOSTON_RE.test(loc) || /\bma\b/.test(loc);

  // USA if explicitly online (most online hackathons accept US participants),
  // a Boston event, or the location mentions a US state name/abbr.
  const mentionsUsState =
    /\b(usa|united states|u\.s\.)\b/.test(loc) ||
    US_STATE_NAMES.some((s) => loc.includes(s)) ||
    loc
      .split(/[\s,]+/)
      .some((tok) => US_STATE_ABBR.has(tok.toUpperCase()));

  const isUsa = isOnline || isBoston || mentionsUsState;

  return { isOnline, isBoston, isUsa };
}

// Stable key so re-running the scraper updates rather than duplicates.
export function makeDedupeKey(raw: RawHackathon): string {
  if (raw.sourceId) return `${raw.source}:${raw.sourceId}`;
  const slug = raw.url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  return `${raw.source}:${slug}`;
}
