import { NextResponse } from "next/server";
import { runEventScan } from "@/services/ticketmaster/scanner";

export const maxDuration = 300; // 5 minutes (Vercel Pro) or 60s on Hobby

function isAuthorized(request: Request): boolean {
  // Vercel crons send Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  // Manual trigger via x-cron-secret header
  const secret = request.headers.get("x-cron-secret");
  if (secret === process.env.CRON_SECRET) return true;
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runEventScan("cron");
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runEventScan("cron");
  return NextResponse.json(result);
}
