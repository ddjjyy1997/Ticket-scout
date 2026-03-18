import { db } from "@/db";
import {
  events,
  eventArtists,
  venues,
  onsaleWindows,
  eventScores,
} from "@/db/schema";
import { eq, and, gte, ne, inArray, sql, asc } from "drizzle-orm";

interface SimilarEvent {
  id: number;
  name: string;
  slug: string;
  eventDate: Date;
  imageUrl: string | null;
  genre: string | null;
  venueName: string | null;
  buyScore: number | null;
  hasUpcomingPresale: boolean;
  matchReason: "artist" | "venue" | "genre";
}

export async function getSimilarEvents(
  eventId: number,
  options: {
    genre: string | null;
    venueId: number | null;
    artistIds: number[];
    limit?: number;
  }
): Promise<SimilarEvent[]> {
  const { genre, venueId, artistIds, limit = 6 } = options;
  const now = new Date();
  const results: SimilarEvent[] = [];
  const seenIds = new Set<number>([eventId]);

  // 1. Same artist events (highest priority)
  if (artistIds.length > 0) {
    const artistEvents = await db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        eventDate: events.eventDate,
        imageUrl: events.imageUrl,
        genre: events.genre,
        venueName: venues.name,
        buyScore: eventScores.buyScore,
      })
      .from(events)
      .innerJoin(eventArtists, eq(eventArtists.eventId, events.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(eventScores, eq(eventScores.eventId, events.id))
      .where(
        and(
          inArray(eventArtists.artistId, artistIds),
          ne(events.id, eventId),
          gte(events.eventDate, now)
        )
      )
      .orderBy(asc(events.eventDate))
      .limit(limit);

    for (const e of artistEvents) {
      if (!seenIds.has(e.id)) {
        seenIds.add(e.id);
        results.push({
          ...e,
          buyScore: e.buyScore ? parseFloat(e.buyScore) : null,
          hasUpcomingPresale: false,
          matchReason: "artist",
        });
      }
    }
  }

  // 2. Same venue events
  if (venueId && results.length < limit) {
    const venueEvents = await db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        eventDate: events.eventDate,
        imageUrl: events.imageUrl,
        genre: events.genre,
        venueName: venues.name,
        buyScore: eventScores.buyScore,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(eventScores, eq(eventScores.eventId, events.id))
      .where(
        and(
          eq(events.venueId, venueId),
          ne(events.id, eventId),
          gte(events.eventDate, now)
        )
      )
      .orderBy(asc(events.eventDate))
      .limit(limit);

    for (const e of venueEvents) {
      if (!seenIds.has(e.id) && results.length < limit) {
        seenIds.add(e.id);
        results.push({
          ...e,
          buyScore: e.buyScore ? parseFloat(e.buyScore) : null,
          hasUpcomingPresale: false,
          matchReason: "venue",
        });
      }
    }
  }

  // 3. Same genre events
  if (genre && results.length < limit) {
    const genreEvents = await db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        eventDate: events.eventDate,
        imageUrl: events.imageUrl,
        genre: events.genre,
        venueName: venues.name,
        buyScore: eventScores.buyScore,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(eventScores, eq(eventScores.eventId, events.id))
      .where(
        and(
          eq(events.genre, genre),
          ne(events.id, eventId),
          gte(events.eventDate, now)
        )
      )
      .orderBy(asc(events.eventDate))
      .limit(limit);

    for (const e of genreEvents) {
      if (!seenIds.has(e.id) && results.length < limit) {
        seenIds.add(e.id);
        results.push({
          ...e,
          buyScore: e.buyScore ? parseFloat(e.buyScore) : null,
          hasUpcomingPresale: false,
          matchReason: "genre",
        });
      }
    }
  }

  // Check which events have upcoming presales
  if (results.length > 0) {
    const eventIds = results.map((r) => r.id);
    const presaleRows = await db
      .select({ eventId: onsaleWindows.eventId })
      .from(onsaleWindows)
      .where(
        and(
          inArray(onsaleWindows.eventId, eventIds),
          gte(onsaleWindows.startDate, now),
          ne(onsaleWindows.windowType, "general")
        )
      );

    const withPresale = new Set(presaleRows.map((r) => r.eventId));
    for (const r of results) {
      r.hasUpcomingPresale = withPresale.has(r.id);
    }

    // Sort: presale events first, then by match reason priority
    results.sort((a, b) => {
      if (a.hasUpcomingPresale !== b.hasUpcomingPresale) {
        return a.hasUpcomingPresale ? -1 : 1;
      }
      const priority = { artist: 0, venue: 1, genre: 2 };
      return priority[a.matchReason] - priority[b.matchReason];
    });
  }

  return results.slice(0, limit);
}
