import { getHackathons, getStats, type FilterKey } from "@/lib/query";
import { HackathonCard } from "@/app/components/HackathonCard";
import type { Hackathon } from "@/app/generated/prisma/client";

// Always read the DB live — the listing changes whenever the agent re-scrapes.
export const dynamic = "force-dynamic";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "boston", label: "Boston" },
  { key: "online", label: "Online" },
  { key: "usa", label: "USA" },
];

function monthKey(d: Date | null): string {
  if (!d) return "Dates TBA";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function groupByMonth(items: Hackathon[]) {
  const groups = new Map<string, Hackathon[]>();
  for (const h of items) {
    const k = monthKey(h.startDate);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(h);
  }
  return [...groups.entries()];
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.key === sp.filter)?.key ??
    "all") as FilterKey;
  const q = sp.q ?? "";

  const [items, stats] = await Promise.all([
    getHackathons({ filter, q }),
    getStats(),
  ]);
  const groups = groupByMonth(items);

  const hrefFor = (key: FilterKey) => {
    const p = new URLSearchParams();
    if (key !== "all") p.set("filter", key);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20">
      {/* Header */}
      <header className="hero-glow -mx-4 px-4 pb-8 pt-14 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Updated daily by an agent
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Hack<span className="text-accent">Radar</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Every hackathon in <span className="text-foreground">Boston</span> and{" "}
          <span className="text-foreground">online across the USA</span> — scraped
          daily from Devpost, MLH and more.
        </p>

        {/* Stats */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <Stat n={stats.total} label="tracked" />
          <Stat n={stats.boston} label="in Boston" />
          <Stat n={stats.online} label="online" />
        </div>
        {stats.lastUpdated && (
          <p className="mt-3 text-xs text-muted">
            Last sync {stats.lastUpdated.toLocaleString("en-US")}
          </p>
        )}
      </header>

      {/* Search */}
      <form action="/" method="get" className="mb-4">
        {filter !== "all" && (
          <input type="hidden" name="filter" value={filter} />
        )}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, location or theme…"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
      </form>

      {/* Filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <a
              key={f.key}
              href={hrefFor(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-accent text-white"
                  : "border border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </a>
          );
        })}
      </div>

      {/* Results */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted">
          No hackathons match. Try a different filter or run{" "}
          <code className="text-foreground">npm run scrape</code>.
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(([month, list]) => (
            <section key={month}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                {month}
              </h2>
              <div className="space-y-3">
                {list.map((h) => (
                  <HackathonCard key={h.id} h={h} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-16 border-t border-border pt-6 text-center text-xs text-muted">
        HackRadar · sources: Devpost, MLH, Eventbrite, Meetup, Luma · built as a
        daily aggregation agent
      </footer>
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xl font-bold text-foreground">{n}</span>
      <span className="text-muted">{label}</span>
    </div>
  );
}
