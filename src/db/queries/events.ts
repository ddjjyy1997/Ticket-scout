import { db } from "@/db";
import {
  events,
  eventSources,
  eventArtists,
  artists,
  onsaleWindows,
  venues,
} from "@/db/schema";
import { eq, and, sql, gte, ilike, desc, asc, count, inArray } from "drizzle-orm";
import type {
  NormalizedEvent,
  NormalizedArtist,
  NormalizedOnsaleWindow,
} from "@/services/ticketmaster/normalize";

interface UpsertResult {
  created: number;
  updated: number;
  createdEventId?: number;
}

export async function upsertEventFromTM(
  normalizedEvent: NormalizedEvent
): Promise<UpsertResult> {
  let created = 0;
  let updated = 0;
  let createdEventId: number | undefined;

  // Check if source already exists
  const [existingSource] = await db
    .select({ id: eventSources.id, eventId: eventSources.eventId })
    .from(eventSources)
    .where(
      and(
        eq(eventSources.source, "ticketmaster"),
        eq(eventSources.sourceEventId, normalizedEvent.sourceEventId)
      )
    )
    .limit(1);

  // Find venue by TM venue ID
  let venueId: number | null = null;
  if (normalizedEvent.tmVenueId) {
    const [venue] = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.tmVenueId, normalizedEvent.tmVenueId))
      .limit(1);
    venueId = venue?.id ?? null;
  }

  if (existingSource) {
    // Update existing event
    await db
      .update(events)
      .set({
        name: normalizedEvent.name,
        eventDate: normalizedEvent.eventDate,
        eventEndDate: normalizedEvent.eventEndDate,
        genre: normalizedEvent.genre,
        subGenre: normalizedEvent.subGenre,
        segment: normalizedEvent.segment,
        imageUrl: normalizedEvent.imageUrl,
        status: normalizedEvent.status,
        priceMin: normalizedEvent.priceMin,
        priceMax: normalizedEvent.priceMax,
        currency: normalizedEvent.currency,
        venueId,
        lastScannedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(events.id, existingSource.eventId));

    // Update source sync time
    await db
      .update(eventSources)
      .set({ lastSyncedAt: new Date() })
      .where(eq(eventSources.id, existingSource.id));

    // Refresh onsale windows
    await db
      .delete(onsaleWindows)
      .where(eq(onsaleWindows.eventId, existingSource.eventId));
    await insertOnsaleWindows(
      existingSource.eventId,
      normalizedEvent.onsaleWindows
    );

    updated = 1;
  } else {
    // Deduplicate: check for same event by slug
    const [existingBySlug] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, normalizedEvent.slug))
      .limit(1);

    if (existingBySlug) {
      // Add source to existing event
      await db.insert(eventSources).values({
        eventId: existingBySlug.id,
        source: "ticketmaster",
        sourceEventId: normalizedEvent.sourceEventId,
        sourceUrl: normalizedEvent.sourceUrl,
        matchConfidence: "1.0",
      });
      updated = 1;
    } else {
      // Create new event
      const [newEvent] = await db
        .insert(events)
        .values({
          name: normalizedEvent.name,
          slug: normalizedEvent.slug,
          venueId,
          eventDate: normalizedEvent.eventDate,
          eventEndDate: normalizedEvent.eventEndDate,
          genre: normalizedEvent.genre,
          subGenre: normalizedEvent.subGenre,
          segment: normalizedEvent.segment,
          imageUrl: normalizedEvent.imageUrl,
          status: normalizedEvent.status,
          priceMin: normalizedEvent.priceMin,
          priceMax: normalizedEvent.priceMax,
          currency: normalizedEvent.currency,
          lastScannedAt: new Date(),
        })
        .returning({ id: events.id });

      // Add source
      await db.insert(eventSources).values({
        eventId: newEvent.id,
        source: "ticketmaster",
        sourceEventId: normalizedEvent.sourceEventId,
        sourceUrl: normalizedEvent.sourceUrl,
        matchConfidence: "1.0",
      });

      // Upsert artists and link them
      await upsertArtists(newEvent.id, normalizedEvent.artists);

      // Insert onsale windows
      await insertOnsaleWindows(newEvent.id, normalizedEvent.onsaleWindows);

      created = 1;
      createdEventId = newEvent.id;
    }
  }

  return { created, updated, createdEventId };
}

async function upsertArtists(
  eventId: number,
  normalizedArtists: NormalizedArtist[]
) {
  for (let i = 0; i < normalizedArtists.length; i++) {
    const a = normalizedArtists[i];

    // Try to find existing artist by TM attraction ID
    let [existing] = await db
      .select({ id: artists.id })
      .from(artists)
      .where(eq(artists.tmAttractionId, a.tmAttractionId))
      .limit(1);

    if (!existing) {
      // Check by slug
      [existing] = await db
        .select({ id: artists.id })
        .from(artists)
        .where(eq(artists.slug, a.slug))
        .limit(1);
    }

    let artistId: number;
    if (existing) {
      artistId = existing.id;
      // Update with latest data
      await db
        .update(artists)
        .set({
          tmAttractionId: a.tmAttractionId,
          genre: a.genre,
          imageUrl: a.imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(artists.id, artistId));
    } else {
      const [newArtist] = await db
        .insert(artists)
        .values({
          name: a.name,
          slug: a.slug,
          normalizedName: a.normalizedName,
          tmAttractionId: a.tmAttractionId,
          genre: a.genre,
          imageUrl: a.imageUrl,
        })
        .returning({ id: artists.id });
      artistId = newArtist.id;
    }

    // Link artist to event (ignore if already linked)
    await db
      .insert(eventArtists)
      .values({
        eventId,
        artistId,
        isPrimary: i === 0,
      })
      .onConflictDoNothing();
  }
}

async function insertOnsaleWindows(
  eventId: number,
  windows: NormalizedOnsaleWindow[]
) {
  if (windows.length === 0) return;
  await db.insert(onsaleWindows).values(
    windows.map((w) => ({
      eventId,
      windowType: w.windowType,
      windowName: w.windowName,
      startDate: w.startDate,
      endDate: w.endDate,
      signupUrl: w.signupUrl ?? null,
    }))
  );
}

export async function getEventsWithScores(options?: {
  limit?: number;
  offset?: number;
  venueIds?: number[];
  statuses?: string[];
  genres?: string[];
  segment?: string;
  search?: string;
  sort?: "date_asc" | "date_desc" | "newest" | "name";
  futureOnly?: boolean;
  minBuyScore?: number;
}) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const conditions = [];
  if (options?.venueIds?.length) conditions.push(inArray(events.venueId, options.venueIds));
  if (options?.statuses?.length) conditions.push(inArray(events.status, options.statuses));
  if (options?.genres?.length) conditions.push(inArray(events.genre, options.genres));
  if (options?.segment) conditions.push(eq(events.segment, options.segment));
  if (options?.search) conditions.push(ilike(events.name, `%${options.search}%`));
  if (options?.futureOnly !== false) conditions.push(gte(events.eventDate, new Date()));
  if (options?.minBuyScore) {
    // Only show events that have been scored and meet the threshold
    conditions.push(
      sql`EXISTS (SELECT 1 FROM event_scores WHERE event_scores.event_id = ${events.id} AND event_scores.buy_score >= ${options.minBuyScore})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy = (() => {
    switch (options?.sort) {
      case "date_asc": return (e: typeof events) => [asc(e.eventDate)];
      case "date_desc": return (e: typeof events) => [desc(e.eventDate)];
      case "name": return (e: typeof events) => [asc(e.name)];
      case "newest":
      default: return (e: typeof events) => [desc(e.createdAt)];
    }
  })();

  return db.query.events.findMany({
    where,
    limit,
    offset,
    orderBy: orderBy as Parameters<typeof db.query.events.findMany>[0] extends { orderBy?: infer O } ? O : never,
    with: {
      venue: true,
      artists: {
        with: { artist: true },
      },
      onsaleWindows: true,
    },
  });
}

export async function getEventFilterOptions() {
  const venueList = await db
    .select({ id: venues.id, name: venues.name })
    .from(venues)
    .orderBy(asc(venues.name));

  const genreRows = await db
    .select({ genre: events.genre })
    .from(events)
    .where(and(gte(events.eventDate, new Date()), sql`${events.genre} IS NOT NULL`))
    .groupBy(events.genre)
    .orderBy(asc(events.genre));

  const statusRows = await db
    .select({ status: events.status, count: count() })
    .from(events)
    .where(gte(events.eventDate, new Date()))
    .groupBy(events.status);

  const segmentRows = await db
    .select({ segment: events.segment })
    .from(events)
    .where(and(gte(events.eventDate, new Date()), sql`${events.segment} IS NOT NULL`))
    .groupBy(events.segment)
    .orderBy(asc(events.segment));

  return {
    venues: venueList,
    genres: genreRows.map((r) => r.genre).filter(Boolean) as string[],
    segments: segmentRows.map((r) => r.segment).filter(Boolean) as string[],
    statuses: statusRows.map((r) => ({ status: r.status, count: r.count })),
  };
}

export async function getEventCount(options?: {
  venueIds?: number[];
  statuses?: string[];
  genres?: string[];
  segment?: string;
  search?: string;
  futureOnly?: boolean;
  minBuyScore?: number;
}) {
  const conditions = [];
  if (options?.venueIds?.length) conditions.push(inArray(events.venueId, options.venueIds));
  if (options?.statuses?.length) conditions.push(inArray(events.status, options.statuses));
  if (options?.genres?.length) conditions.push(inArray(events.genre, options.genres));
  if (options?.segment) conditions.push(eq(events.segment, options.segment));
  if (options?.search) conditions.push(ilike(events.name, `%${options.search}%`));
  if (options?.futureOnly !== false) conditions.push(gte(events.eventDate, new Date()));
  if (options?.minBuyScore) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM event_scores WHERE event_scores.event_id = ${events.id} AND event_scores.buy_score >= ${options.minBuyScore})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [result] = await db.select({ count: count() }).from(events).where(where);
  return result.count;
}

export async function getEventBySlug(slug: string) {
  return db.query.events.findFirst({
    where: eq(events.slug, slug),
    with: {
      venue: true,
      sources: true,
      artists: {
        with: { artist: true },
      },
      onsaleWindows: true,
    },
  });
}
