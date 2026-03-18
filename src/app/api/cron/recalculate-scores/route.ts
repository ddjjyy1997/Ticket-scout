import { NextResponse } from "next/server";
import { backfillEventScores } from "@/lib/scoring/auto-score";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret") ??
    new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scored = await backfillEventScores();
  return NextResponse.json({ scored });
}
