import type { SourceAdapter } from "../types";
import { devpost } from "./devpost";
import { mlh } from "./mlh";
import { eventbrite } from "./eventbrite";
import { luma } from "./luma";
import { meetup } from "./meetup";

// Register a new source by adding its adapter here. The aggregator runs all of
// them, handles tagging/dedupe/persistence, and isolates per-source failures.
//   • devpost, mlh        — hackathon-native (online + national + college)
//   • eventbrite, luma,
//     meetup              — broad event sites, filtered to hackathons; fill the
//                           Boston in-person gap
export const SOURCES: SourceAdapter[] = [
  devpost,
  mlh,
  eventbrite,
  luma,
  meetup,
];
