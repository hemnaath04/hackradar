import type { RawHackathon, SourceAdapter } from "../types";

// Devpost exposes an undocumented but stable JSON API powering its hackathon
// directory. We pull the "online" feed (most relevant for USA-wide remote
// events) plus a Boston location search, across a few pages.
const BASE = "https://devpost.com/api/hackathons";

interface DevpostHackathon {
  id: number;
  title: string;
  url: string;
  displayed_location?: { location?: string };
  open_state?: string;
  thumbnail_url?: string;
  submission_period_dates?: string;
  themes?: { name: string }[];
  prize_amount?: string;
  registrations_count?: number;
}

function stripHtml(s?: string): string | undefined {
  if (!s) return undefined;
  const txt = s.replace(/<[^>]*>/g, "").trim();
  return txt.length ? txt : undefined;
}

function normalizeUrl(u: string): string {
  return u.startsWith("//") ? `https:${u}` : u;
}

// Parse the human date label into start/end Dates. Handles:
//   "May 19 - Aug 17, 2026"   (month on both sides)
//   "Jun 14 - 21, 2026"        (day-only end -> carry the start month)
//   "Mar 21, 2026"             (single day)
function parseDates(text?: string): { start?: Date; end?: Date } {
  if (!text) return {};
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
  const noYear = text.replace(/,?\s*20\d{2}/, "").trim();
  const parts = noYear.split(/\s*[-–]\s*/).map((p) => p.trim());

  const valid = (d: Date): Date | undefined =>
    isNaN(d.getTime()) ? undefined : d;

  const first = parts[0];
  const monthMatch = first.match(/^([A-Za-z]{3,})/);
  const startMonth = monthMatch?.[1];
  const start = valid(new Date(`${first}, ${year}`));

  if (!parts[1]) return { start };

  const second = parts[1];
  // Bare day like "21" -> reuse the start month.
  const end = /^\d{1,2}$/.test(second) && startMonth
    ? valid(new Date(`${startMonth} ${second}, ${year}`))
    : valid(new Date(`${second}, ${year}`));

  return { start, end };
}

async function fetchPage(params: string): Promise<DevpostHackathon[]> {
  const res = await fetch(`${BASE}?${params}`, {
    headers: { Accept: "application/json", "User-Agent": "HackRadar/1.0" },
  });
  if (!res.ok) throw new Error(`Devpost ${params} -> ${res.status}`);
  const json = (await res.json()) as { hackathons?: DevpostHackathon[] };
  return json.hackathons ?? [];
}

function toRaw(h: DevpostHackathon): RawHackathon {
  const dates = parseDates(h.submission_period_dates);
  return {
    source: "devpost",
    sourceId: String(h.id),
    title: h.title,
    url: h.url,
    imageUrl: h.thumbnail_url ? normalizeUrl(h.thumbnail_url) : undefined,
    location: h.displayed_location?.location,
    startDate: dates.start,
    endDate: dates.end,
    datesText: h.submission_period_dates,
    prizeText: stripHtml(h.prize_amount),
    participants: h.registrations_count,
    themes: h.themes?.map((t) => t.name),
    openState: h.open_state,
  };
}

export const devpost: SourceAdapter = {
  name: "devpost",
  async fetch() {
    // status filter on every query so we never pull ended hackathons.
    const STATUS = "status[]=open&status[]=upcoming";
    const queries = [
      `challenge_type[]=online&${STATUS}`,
      `search=boston&${STATUS}`,
      `search=massachusetts&${STATUS}`,
    ];
    const out = new Map<number, DevpostHackathon>();
    for (const q of queries) {
      for (let page = 1; page <= 3; page++) {
        try {
          const batch = await fetchPage(`${q}&page=${page}`);
          if (batch.length === 0) break;
          for (const h of batch) out.set(h.id, h);
        } catch (err) {
          console.warn(`[devpost] ${q} p${page} failed:`, (err as Error).message);
          break;
        }
      }
    }
    return [...out.values()].map(toRaw);
  },
};
