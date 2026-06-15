// Normalized record every source adapter must emit.
// The aggregator handles tagging + dedupe + persistence, so adapters
// only need to map their raw payload into this shape.
export interface RawHackathon {
  source: string;
  sourceId?: string;
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  location?: string; // free text, e.g. "Boston, MA" or "Online"
  startDate?: Date;
  endDate?: Date;
  datesText?: string;
  prizeText?: string;
  participants?: number;
  themes?: string[];
  openState?: string; // "open" | "upcoming" | "ended"
}

export interface SourceAdapter {
  name: string;
  // Fetch and return normalized records. Should never throw for partial
  // failures — log and return what it could get.
  fetch(): Promise<RawHackathon[]>;
}
