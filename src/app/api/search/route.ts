import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { artists, venues } from "@/db/schema";
import { ilike, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const type = request.nextUrl.searchParams.get("type"); // 'artist' | 'venue'

  if (!q || q.length < 2) {
    return NextResponse.json({ artists: [], venues: [] });
  }

  const pattern = `%${q}%`;

  if (type === "artist" || !type) {
    const artistResults = await db
      .select({ id: artists.id, name: artists.name, genre: artists.genre, imageUrl: artists.imageUrl })
      .from(artists)
      .where(ilike(artists.name, pattern))
      .orderBy(asc(artists.name))
      .limit(20);

    if (type === "artist") {
      return NextResponse.json({ artists: artistResults });
    }

    const venueResults = await db
      .select({ id: venues.id, name: venues.name, city: venues.city, capacity: venues.capacity })
      .from(venues)
      .where(ilike(venues.name, pattern))
      .orderBy(asc(venues.name))
      .limit(20);

    return NextResponse.json({ artists: artistResults, venues: venueResults });
  }

  const venueResults = await db
    .select({ id: venues.id, name: venues.name, city: venues.city, capacity: venues.capacity })
    .from(venues)
    .where(ilike(venues.name, pattern))
    .orderBy(asc(venues.name))
    .limit(20);

  return NextResponse.json({ venues: venueResults });
}
