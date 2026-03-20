import { NextResponse } from "next/server";
import { db } from "@/db";
import { scanRuns } from "@/db/schema";
import { gte, desc } from "drizzle-orm";

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

  // Check if any scan ran today
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayScans = await db
    .select({ id: scanRuns.id, status: scanRuns.status, completedAt: scanRuns.completedAt })
    .from(scanRuns)
    .where(gte(scanRuns.startedAt, todayStart))
    .orderBy(desc(scanRuns.startedAt))
    .limit(5);

  const hasCompletedScan = todayScans.some(
    (s) => s.status === "completed" || s.status === "partial"
  );

  if (hasCompletedScan) {
    return NextResponse.json({
      status: "ok",
      message: "Scan already ran today",
      scans: todayScans.length,
    });
  }

  // No completed scan today — trigger one
  try {
    await fetch(`${APP_URL}/api/cron/scan-events?batch=0`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });

    return NextResponse.json({
      status: "triggered",
      message: "No scan found today — triggered batch 0",
      todayScans: todayScans.length,
    });
  } catch (err) {
    return NextResponse.json({
      status: "error",
      message: `Failed to trigger scan: ${err instanceof Error ? err.message : "Unknown"}`,
    });
  }
}
