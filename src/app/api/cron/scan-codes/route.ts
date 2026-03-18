import { NextResponse } from "next/server";
import { runCodeScan } from "@/services/code-scanner";
import type { ScanMode } from "@/services/code-scanner/scanner";

/**
 * Presale Code Scanner Cron Job
 *
 * Two schedules:
 *  - Morning (5:30 AM UTC): mode=morning — scans today+tomorrow's artist/LN presales
 *  - Every 10 min (6 AM–12 PM UTC): mode=jit — scans presales starting in next 10-20 min
 *
 * Only scans artist and Live Nation presales (the ones that use codes).
 * Skips events that already have a verified/upvoted working code.
 *
 * Pass ?mode=jit or ?mode=morning as query param (defaults to morning).
 */
export async function POST(request: Request) {
  // Verify cron secret
  const url = new URL(request.url);
  const secret =
    request.headers.get("x-cron-secret") ??
    url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mode = (url.searchParams.get("mode") ?? "morning") as ScanMode;

  try {
    const result = await runCodeScan(mode);
    return NextResponse.json(result);
  } catch (err) {
    console.error(`[cron/scan-codes:${mode}] Fatal error:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
