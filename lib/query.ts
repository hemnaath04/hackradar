import { db } from "./db";
import type { Prisma } from "@/app/generated/prisma/client";

export type FilterKey = "all" | "boston" | "online" | "usa";

export interface QueryParams {
  filter: FilterKey;
  q?: string;
  includePast?: boolean;
}

export async function getHackathons(params: QueryParams) {
  const where: Prisma.HackathonWhereInput = {};

  if (params.filter === "boston") where.isBoston = true;
  else if (params.filter === "online") where.isOnline = true;
  else if (params.filter === "usa") where.isUsa = true;

  if (params.q && params.q.trim()) {
    const q = params.q.trim();
    where.OR = [
      { title: { contains: q } },
      { location: { contains: q } },
      { themes: { contains: q } },
    ];
  }

  // Default to events that haven't already ended. Ingestion already drops
  // past/ended events, but this guards the view too. Undated events (a source
  // marked them open) are kept and sorted to the end.
  if (!params.includePast) {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    where.AND = [
      // null-safe: events from Eventbrite/Meetup/Luma have no openState, and
      // `NOT ended` in SQL would otherwise drop NULLs.
      { OR: [{ openState: { not: "ended" } }, { openState: null }] },
      { OR: [{ endDate: { gte: cutoff } }, { endDate: null }] },
    ];
  }

  return db.hackathon.findMany({
    where,
    orderBy: [
      { startDate: { sort: "asc", nulls: "last" } },
      { lastSeenAt: "desc" },
    ],
    take: 300,
  });
}

export async function getStats() {
  const [total, boston, online, usa] = await Promise.all([
    db.hackathon.count(),
    db.hackathon.count({ where: { isBoston: true } }),
    db.hackathon.count({ where: { isOnline: true } }),
    db.hackathon.count({ where: { isUsa: true } }),
  ]);
  const latest = await db.hackathon.findFirst({
    orderBy: { lastSeenAt: "desc" },
    select: { lastSeenAt: true },
  });
  return { total, boston, online, usa, lastUpdated: latest?.lastSeenAt ?? null };
}
