import { NextResponse } from "next/server";
import { db } from "@/db";
import { scanRuns } from "@/db/schema";
import { desc } from "drizzle-orm";

export const maxDuration = 30;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ticketscout.ca";

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  const secret = request.headers.get("x-cron-secret");
  if (secret === process.env.CRON_SECRET) return true;
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if a scan ran today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [lastRun] = await db
    .select({ startedAt: scanRuns.startedAt, status: scanRuns.status })
    .from(scanRuns)
    .orderBy(desc(scanRuns.startedAt))
    .limit(1);

  const ranToday = lastRun && lastRun.startedAt >= todayStart;

  if (ranToday) {
    return NextResponse.json({
      message: "Scan already ran today",
      lastRun: lastRun.startedAt,
      status: lastRun.status,
    });
  }

  // No scan today — trigger batch 0
  try {
    await fetch(`${APP_URL}/api/cron/scan-events?batch=0`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
  } catch {
    // Retry once
    try {
      await fetch(`${APP_URL}/api/cron/scan-events?batch=0`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
    } catch {}
  }

  return NextResponse.json({
    message: "No scan found today — triggered recovery scan",
    lastRun: lastRun?.startedAt ?? null,
  });
}
