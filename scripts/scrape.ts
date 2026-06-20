// Daily scraper entrypoint. Run with: npm run scrape
// Locally: cron / launchd calls this. On a platform: the cron route hits the
// same runAggregation() so behavior is identical.
import "dotenv/config";
import { runAggregation } from "../lib/aggregate";
import { db } from "../lib/db";

async function main() {
  const started = Date.now();
  console.log("[scrape] starting aggregation…");
  const result = await runAggregation();
  const secs = ((Date.now() - started) / 1000).toFixed(1);

  console.log("\n=== HackRadar scrape complete ===");
  console.log(`time:      ${secs}s`);
  console.log(`fetched:   ${result.fetched}`);
  console.log(`upserted:  ${result.upserted}`);
  console.log(`per source:`, result.perSource);
  console.log(`boston:    ${result.bostonCount}`);
  console.log(`online:    ${result.onlineCount}`);
  if (result.errors.length) console.log(`errors:`, result.errors);

  const total = await db.hackathon.count();
  console.log(`total rows in db: ${total}`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error("[scrape] fatal:", err);
  process.exit(1);
});
