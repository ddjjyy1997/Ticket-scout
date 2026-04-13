import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, eventArtists, artists, venues } from "@/db/schema";
import { eq, gte, sql, and, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const city = request.nextUrl.searchParams.get("city");

  // Get venue IDs for the city
  let venueFilter: number[] = [];
  if (city) {
    const cityVenues = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.city, city));
    venueFilter = cityVenues.map((v) => v.id);
    if (venueFilter.length === 0) {
      return NextResponse.json({ artists: [] });
    }
  }

  // Find artists with the most upcoming events in this city
  const now = new Date();
  const conditions = [gte(events.eventDate, now)];
  if (venueFilter.length > 0) {
    conditions.push(inArray(events.venueId, venueFilter));
  }

  const popularArtists = await db
    .select({
      artistId: eventArtists.artistId,
      name: artists.name,
      genre: artists.genre,
      imageUrl: artists.imageUrl,
      eventCount: sql<number>`count(distinct ${events.id})`.as("event_count"),
    })
    .from(eventArtists)
    .innerJoin(events, eq(eventArtists.eventId, events.id))
    .innerJoin(artists, eq(eventArtists.artistId, artists.id))
    .where(and(...conditions))
    .groupBy(eventArtists.artistId, artists.name, artists.genre, artists.imageUrl)
    .orderBy(sql`count(distinct ${events.id}) desc`)
    .limit(12);

  return NextResponse.json({
    artists: popularArtists.map((a) => ({
      id: a.artistId,
      name: a.name,
      genre: a.genre,
      imageUrl: a.imageUrl,
      eventCount: Number(a.eventCount),
    })),
  });
}
