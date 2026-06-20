import type { Hackathon } from "@/app/generated/prisma/client";

const sourceLabels: Record<string, string> = {
  devpost: "Devpost",
  mlh: "MLH",
  eventbrite: "Eventbrite",
  meetup: "Meetup",
  luma: "Luma",
};

function dayBadge(d: Date | null) {
  if (!d) return { mon: "TBA", day: "" };
  return {
    mon: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getUTCDate()),
  };
}

export function HackathonCard({ h }: { h: Hackathon }) {
  const badge = dayBadge(h.startDate);
  const themes = h.themes?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  return (
    <a
      href={h.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-accent/60 hover:bg-surface-2"
    >
      {/* date chip */}
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-soft text-accent">
        <span className="text-xs font-semibold tracking-wide">{badge.mon}</span>
        <span className="text-2xl font-bold leading-none">{badge.day}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-foreground group-hover:text-accent">
            {h.title}
          </h3>
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            {sourceLabels[h.source] ?? h.source}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          {h.datesText && <span>{h.datesText}</span>}
          <span className="flex items-center gap-1">
            {h.isOnline ? "🌐" : "📍"} {h.location ?? "Location TBA"}
          </span>
          {h.prizeText && <span className="text-foreground/80">🏆 {h.prizeText}</span>}
          {typeof h.participants === "number" && h.participants > 0 && (
            <span>👥 {h.participants.toLocaleString()}</span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {h.isBoston && (
            <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              Boston
            </span>
          )}
          {h.isOnline && (
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
              Online
            </span>
          )}
          {themes.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
