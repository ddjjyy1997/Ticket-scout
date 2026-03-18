import { NextResponse } from "next/server";
import { runEventScan } from "@/services/ticketmaster/scanner";

export async function POST(request: Request) {
  // Verify cron secret
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runEventScan("cron");
  return NextResponse.json(result);
}
