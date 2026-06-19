import type { RawHackathon, SourceAdapter } from "../types";
import { extractBalanced } from "../extract";
import { isHackathonish } from "../hackathonFilter";

// Luma has no public API, but its city pages embed event entries as
// `{"api_id":"evt-..."}` wrapper objects, each holding a nested `event`.
// We balanced-extract those wrappers and keep hackathon-like events.
const CITY_URLS = ["https://lu.ma/boston"];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

interface LumaEvent {
  api_id?: string;
  name?: string;
  start_at?: string;
  end_at?: string;
  location_type?: string; // "offline" | "online" | ...
  url?: string; // slug
  cover_url?: string;
  social_image_url?: string;
  geo_address_info?: {
    city?: string;
    region?: string;
    region_short?: string;
    country?: string;
  } | null;
}
interface LumaWrapper {
  api_id?: string;
  event?: LumaEvent;
}

function toRaw(e: LumaEvent): RawHackathon {
  const g = e.geo_address_info;
  const online = e.location_type && e.location_type !== "offline";
  const location = online
    ? "Online"
    : g
      ? [g.city, g.region_short ?? g.region].filter(Boolean).join(", ")
      : undefined;
  return {
    source: "luma",
    sourceId: e.api_id,
    title: e.name ?? "",
    url: e.url ? `https://lu.ma/${e.url}` : "https://lu.ma",
    imageUrl: e.cover_url ?? e.social_image_url,
    location,
    startDate: e.start_at ? new Date(e.start_at) : undefined,
    endDate: e.end_at ? new Date(e.end_at) : undefined,
  };
}

export const luma: SourceAdapter = {
  name: "luma",
  async fetch() {
    const out = new Map<string, LumaEvent>();
    for (const url of CITY_URLS) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA } });
        if (!res.ok) {
          console.warn(`[luma] ${url} -> ${res.status}`);
          continue;
        }
        const html = await res.text();
        const needle = '{"api_id":"evt-';
        let from = html.indexOf(needle);
        while (from !== -1) {
          const slice = extractBalanced(html, from);
          if (slice) {
            try {
              const wrapper = JSON.parse(slice) as LumaWrapper;
              const e = wrapper.event;
              if (e?.api_id && e.name && isHackathonish(e.name)) {
                out.set(e.api_id, e);
              }
            } catch {
              /* skip malformed entry */
            }
          }
          from = html.indexOf(needle, from + needle.length);
        }
      } catch (err) {
        console.warn(`[luma] ${url} failed:`, (err as Error).message);
      }
    }
    return [...out.values()].map(toRaw);
  },
};
