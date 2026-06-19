import type { RawHackathon, SourceAdapter } from "../types";
import { parseJsonAfter } from "../extract";
import { isHackathonish } from "../hackathonFilter";

// Eventbrite removed its public search API, but its search pages embed results
// in `window.__SERVER_DATA__` at search_data.events.results. We read the Boston
// "hackathon" search page and keep events that actually read like hackathons.
const SEARCH_URLS = [
  "https://www.eventbrite.com/d/ma--boston/hackathon/",
  "https://www.eventbrite.com/d/online/hackathon/",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

interface EbVenue {
  name?: string;
  address?: { city?: string; region?: string; country?: string };
}
interface EbEvent {
  eventbrite_event_id?: string;
  id?: string;
  name?: string;
  summary?: string;
  url?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  is_online_event?: boolean;
  is_cancelled?: boolean;
  primary_venue?: EbVenue;
  tags?: { display_name?: string }[];
  image?: string | { url?: string };
}

function combine(date?: string, time?: string): Date | undefined {
  if (!date) return undefined;
  const d = new Date(`${date}T${time ?? "00:00"}:00`);
  return isNaN(d.getTime()) ? undefined : d;
}

function imageUrl(img: EbEvent["image"]): string | undefined {
  if (!img) return undefined;
  return typeof img === "string" ? img : img.url;
}

function toRaw(e: EbEvent): RawHackathon {
  const v = e.primary_venue;
  const location = e.is_online_event
    ? "Online"
    : v?.address
      ? [v.address.city, v.address.region].filter(Boolean).join(", ") ||
        v.name
      : v?.name;
  return {
    source: "eventbrite",
    sourceId: e.eventbrite_event_id ?? e.id,
    title: e.name ?? "",
    url: e.url ?? "",
    description: e.summary,
    imageUrl: imageUrl(e.image),
    location,
    startDate: combine(e.start_date, e.start_time),
    endDate: combine(e.end_date, e.end_time),
    themes: e.tags?.map((t) => t.display_name ?? "").filter(Boolean),
  };
}

export const eventbrite: SourceAdapter = {
  name: "eventbrite",
  async fetch() {
    const out = new Map<string, EbEvent>();
    for (const url of SEARCH_URLS) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA } });
        if (!res.ok) {
          console.warn(`[eventbrite] ${url} -> ${res.status}`);
          continue;
        }
        const html = await res.text();
        const data = parseJsonAfter(
          html,
          /window\.__SERVER_DATA__\s*=\s*/,
        ) as { search_data?: { events?: { results?: EbEvent[] } } } | null;
        const results = data?.search_data?.events?.results ?? [];
        for (const e of results) {
          if (e.is_cancelled) continue;
          const id = e.eventbrite_event_id ?? e.id;
          if (!id) continue;
          if (!isHackathonish(e.name, e.summary)) continue;
          out.set(id, e);
        }
      } catch (err) {
        console.warn(`[eventbrite] ${url} failed:`, (err as Error).message);
      }
    }
    return [...out.values()].map(toRaw);
  },
};
