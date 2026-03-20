import { NextResponse } from "next/server";
import { runEventScan, runBatchedEventScan } from "@/services/ticketmaster/scanner";

export const maxDuration = 60; // Vercel Hobby max

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ticketscout.ca";

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  const secret = request.headers.get("x-cron-secret");
  if (secret === process.env.CRON_SECRET) return true;
  return false;
}

function triggerNext(batch: number) {
  // Fire-and-forget: trigger next batch
  fetch(`${APP_URL}/api/cron/scan-events?batch=${batch}`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  }).catch(() => {
    // Retry once after 5s
    setTimeout(() => {
      fetch(`${APP_URL}/api/cron/scan-events?batch=${batch}`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).catch(() => {});
    }, 5000);
  });
}

function triggerScoreRecalc() {
  // After all batches done, trigger score recalculation
  fetch(`${APP_URL}/api/cron/recalculate-scores`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  }).catch(() => {});
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const batch = parseInt(url.searchParams.get("batch") || "0", 10);

  const result = await runBatchedEventScan("cron", batch);

  if (result.hasMore) {
    triggerNext(batch + 1);
  } else {
    // Last batch — trigger score recalc
    triggerScoreRecalc();
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const batch = body.batch;

  if (typeof batch === "number") {
    const result = await runBatchedEventScan("manual", batch);

    if (result.hasMore) {
      triggerNext(batch + 1);
    } else {
      triggerScoreRecalc();
    }

    return NextResponse.json(result);
  }

  // Legacy full scan (may timeout on Hobby with 105 venues)
  const result = await runEventScan("manual");
  return NextResponse.json(result);
}
