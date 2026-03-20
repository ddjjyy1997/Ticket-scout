import { NextResponse } from "next/server";
import { backfillEventScores } from "@/lib/scoring/auto-score";

export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  const secret = request.headers.get("x-cron-secret") ??
    new URL(request.url).searchParams.get("secret");
  if (secret === process.env.CRON_SECRET) return true;
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const scored = await backfillEventScores();
  return NextResponse.json({ scored });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const scored = await backfillEventScores();
  return NextResponse.json({ scored });
}
