import { db } from "./db";
import { SOURCES } from "./sources";
import { deriveTags, makeDedupeKey } from "./tagging";
import type { RawHackathon } from "./types";

export interface RunResult {
  fetched: number;
  upserted: number;
  perSource: Record<string, number>;
  bostonCount: number;
  onlineCount: number;
  errors: string[];
}

// Pull from every registered source, normalize + tag, and upsert by dedupeKey.
// Safe to run repeatedly — existing rows are updated (lastSeenAt bumped),
// new rows inserted.
export async function runAggregation(): Promise<RunResult> {
  const result: RunResult = {
    fetched: 0,
    upserted: 0,
    perSource: {},
    bostonCount: 0,
    onlineCount: 0,
    errors: [],
  };

  const all: RawHackathon[] = [];
  for (const source of SOURCES) {
    try {
      const records = await source.fetch();
      result.perSource[source.name] = records.length;
      all.push(...records);
    } catch (err) {
      result.perSource[source.name] = 0;
      result.errors.push(`${source.name}: ${(err as Error).message}`);
    }
  }
  result.fetched = all.length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  for (const raw of all) {
    if (!raw.title || !raw.url) continue;

    // Drop anything already finished. An event is "past" only if we have a
    // date proving it ended before today — undated events are kept (a source
    // marked them open/upcoming), but explicitly "ended" ones are dropped.
    if (raw.openState === "ended") continue;
    const endish = raw.endDate ?? raw.startDate;
    if (endish && endish < startOfToday) continue;

    const tags = deriveTags(raw);
    if (tags.isBoston) result.bostonCount++;
    if (tags.isOnline) result.onlineCount++;

    const dedupeKey = makeDedupeKey(raw);
    const data = {
      title: raw.title,
      url: raw.url,
      description: raw.description ?? null,
      imageUrl: raw.imageUrl ?? null,
      source: raw.source,
      sourceId: raw.sourceId ?? null,
      location: raw.location ?? null,
      isOnline: tags.isOnline,
      isBoston: tags.isBoston,
      isUsa: tags.isUsa,
      startDate: raw.startDate ?? null,
      endDate: raw.endDate ?? null,
      datesText: raw.datesText ?? null,
      prizeText: raw.prizeText ?? null,
      participants: raw.participants ?? null,
      themes: raw.themes?.join(", ") ?? null,
      openState: raw.openState ?? null,
      lastSeenAt: new Date(),
    };

    try {
      await db.hackathon.upsert({
        where: { dedupeKey },
        create: { dedupeKey, ...data },
        update: data,
      });
      result.upserted++;
    } catch (err) {
      result.errors.push(`upsert ${dedupeKey}: ${(err as Error).message}`);
    }
  }

  return result;
}
