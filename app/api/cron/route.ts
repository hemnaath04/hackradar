import { runAggregation } from "@/lib/aggregate";

// Daily aggregation endpoint. Same logic as the CLI runner so local + hosted
// behave identically. Protect with CRON_SECRET when deployed (Vercel Cron sends
// `Authorization: Bearer <CRON_SECRET>` automatically when the env var is set).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runAggregation();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
