import type { RawHackathon, SourceAdapter } from "../types";

// Major League Hacking publishes its season events as an embedded JSON blob
// (`"upcomingEvents":[...]`) inside the events page HTML. We balanced-bracket
// extract that array rather than scraping DOM nodes, which are React-rendered.
const SEASONS = ["2026", "2027"];

interface MlhEvent {
  id: string;
  slug: string;
  name: string;
  status?: string;
  startsAt?: string;
  endsAt?: string;
  dateRange?: string;
  url?: string; // relative MLH path
  websiteUrl?: string; // canonical event page
  location?: string;
  formatType?: string; // "digital" | "physical" | "hybrid"
  logoUrl?: string;
  backgroundUrl?: string;
  venueAddress?: { city?: string; state?: string; country?: string } | null;
}

function extractArray(html: string, key: string): unknown[] {
  const marker = `"${key}":`;
  const start = html.indexOf(marker);
  if (start === -1) return [];
  let i = start + marker.length;
  if (html[i] !== "[") return [];
  let depth = 0;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(i, j + 1));
        } catch {
          return [];
        }
      }
    }
  }
  return [];
}

function toRaw(e: MlhEvent): RawHackathon {
  const v = e.venueAddress;
  const location =
    e.location ??
    (v ? [v.city, v.state, v.country].filter(Boolean).join(", ") : undefined);
  return {
    source: "mlh",
    sourceId: e.id ?? e.slug,
    title: e.name,
    url: e.websiteUrl ?? (e.url ? `https://mlh.io${e.url}` : "https://mlh.io"),
    imageUrl: e.logoUrl ?? e.backgroundUrl,
    location,
    startDate: e.startsAt ? new Date(e.startsAt) : undefined,
    endDate: e.endsAt ? new Date(e.endsAt) : undefined,
    datesText: e.dateRange,
    openState: e.status === "published" ? "open" : e.status,
  };
}

export const mlh: SourceAdapter = {
  name: "mlh",
  async fetch() {
    const out = new Map<string, MlhEvent>();
    for (const season of SEASONS) {
      try {
        const res = await fetch(`https://mlh.io/seasons/${season}/events`, {
          headers: { "User-Agent": "Mozilla/5.0 (HackRadar)" },
        });
        if (!res.ok) {
          console.warn(`[mlh] season ${season} -> ${res.status}`);
          continue;
        }
        const html = await res.text();
        // Only upcoming — pastEvents would flood the feed with finished events.
        const events = extractArray(html, "upcomingEvents") as MlhEvent[];
        for (const e of events) if (e?.id || e?.slug) out.set(e.id ?? e.slug, e);
      } catch (err) {
        console.warn(`[mlh] season ${season} failed:`, (err as Error).message);
      }
    }
    return [...out.values()].map(toRaw);
  },
};
