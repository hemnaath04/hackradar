import type { RawHackathon, SourceAdapter } from "../types";
import { isHackathonish } from "../hackathonFilter";

// Meetup's GraphQL API needs OAuth, but its search page ships an Apollo cache
// in `__NEXT_DATA__`. We walk it for event nodes (title + eventUrl) and keep
// hackathon-like ones. Boston in-person is the primary gap this fills.
const SEARCH_URLS = [
  "https://www.meetup.com/find/?keywords=hackathon&source=EVENTS&location=us--ma--Boston",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

interface MuVenue {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
}
interface MuEvent {
  id?: string;
  title?: string;
  description?: string;
  dateTime?: string;
  endTime?: string | null;
  eventUrl?: string;
  eventType?: string; // "PHYSICAL" | "ONLINE"
  venue?: MuVenue | null;
  featuredEventPhoto?: { source?: string; highResUrl?: string } | null;
}

// Recursively collect nodes that look like events.
function collectEvents(node: unknown, acc: MuEvent[]): void {
  if (Array.isArray(node)) {
    for (const v of node) collectEvents(v, acc);
  } else if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.title === "string" && typeof o.eventUrl === "string") {
      acc.push(o as MuEvent);
    }
    for (const v of Object.values(o)) collectEvents(v, acc);
  }
}

function toRaw(e: MuEvent): RawHackathon {
  const online = e.eventType === "ONLINE" || !e.venue;
  const v = e.venue;
  const location = online
    ? "Online"
    : v
      ? [v.city, v.state].filter(Boolean).join(", ") || v.name
      : undefined;
  return {
    source: "meetup",
    sourceId: e.id,
    title: e.title ?? "",
    url: e.eventUrl ?? "",
    description: e.description?.slice(0, 280),
    imageUrl: e.featuredEventPhoto?.highResUrl ?? e.featuredEventPhoto?.source,
    location,
    startDate: e.dateTime ? new Date(e.dateTime) : undefined,
    endDate: e.endTime ? new Date(e.endTime) : undefined,
  };
}

export const meetup: SourceAdapter = {
  name: "meetup",
  async fetch() {
    const out = new Map<string, MuEvent>();
    for (const url of SEARCH_URLS) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA } });
        if (!res.ok) {
          console.warn(`[meetup] ${url} -> ${res.status}`);
          continue;
        }
        const html = await res.text();
        const m = html.match(
          /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
        );
        if (!m) continue;
        const data = JSON.parse(m[1]);
        const events: MuEvent[] = [];
        collectEvents(data, events);
        for (const e of events) {
          const id = e.id ?? e.eventUrl;
          if (!id || !e.eventUrl) continue;
          if (!isHackathonish(e.title, e.description)) continue;
          out.set(id, e);
        }
      } catch (err) {
        console.warn(`[meetup] ${url} failed:`, (err as Error).message);
      }
    }
    return [...out.values()].map(toRaw);
  },
};
