// Broad sources (Eventbrite, Luma, Meetup) return all kinds of events even when
// we search "hackathon", so we keep only the ones that actually read like a
// hackathon. Devpost/MLH are hackathon-native and skip this filter.
const HACK_RE =
  /hack[\s-]?a?thon|hack[\s-]?night|hack[\s-]?day|hack[\s-]?fest|datathon|make[\s-]?a?thon|game[\s-]?jam|code[\s-]?a?thon|build[\s-]?a?thon/i;

export function isHackathonish(
  ...texts: (string | null | undefined)[]
): boolean {
  return HACK_RE.test(texts.filter(Boolean).join("  "));
}
