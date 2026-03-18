import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEventsWithScores } from "@/db/queries/events";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const venueIds = searchParams.get("venueId")
    ? [parseInt(searchParams.get("venueId")!)]
    : undefined;
  const statuses = searchParams.get("status")
    ? [searchParams.get("status")!]
    : undefined;
  const genres = searchParams.get("genre")
    ? [searchParams.get("genre")!]
    : undefined;

  const events = await getEventsWithScores({
    limit,
    offset,
    venueIds,
    statuses,
    genres,
  });

  return NextResponse.json({ events, count: events.length });
}
