import { db } from "@/db";
import {
  events,
  eventSources,
  eventArtists,
  onsaleWindows,
  venues,
  artists,
  eventScores,
} from "@/db/schema";
import {
  eq,
  gte,
  and,
  count,
  desc,
  asc,
  ilike,
  inArray,
  sql,
} from "drizzle-orm";
import type { NormalizedEvent } from "@/services/ticketmaster/normalize";

// ---------------------------------------------------------------------------
// getEventBySlug — used by event detail + share pages
// ---------------------------------------------------------------------------

export async function getEventBySlug(slug: string) {
  const result = await db.query.events.findFirst({
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

  return result ?? null;
}

// ---------------------------------------------------------------------------
// getEventsWithScores — paginated event listing with optional filters
// ---------------------------------------------------------------------------

interface EventFilterOpts {
  venueIds?: number[];
  statuses?: string[];
  genres?: string[];
  segment?: string;
  search?: string;
  minBuyScore?: number;
  city?: string;
}

export async function getEventsWithScores(
  opts: EventFilterOpts & {
    sort?: "date_asc" | "date_desc" | "newest" | "name";
    limit?: number;
    offset?: number;
  }
) {
  const {
    venueIds,
    statuses,
    genres,
    segment,
    search,
    minBuyScore,
    city,
    sort = "date_asc",
    limit = 24,
    offset = 0,
  } = opts;

  const now = new Date();
  const conditions = [gte(events.eventDate, now)];

  if (venueIds && venueIds.length > 0) {
    conditions.push(inArray(events.venueId, venueIds));
  }
  if (statuses && statuses.length > 0) {
    conditions.push(inArray(events.status, statuses));
  }
  if (genres && genres.length > 0) {
    conditions.push(inArray(events.genre, genres));
  }
  if (segment) {
    conditions.push(eq(events.segment, segment));
  }
  if (search) {
    conditions.push(ilike(events.name, `%${search}%`));
  }
  // For city filter, resolve venue IDs first then use standard query
  if (city) {
    const cityVenues = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.city, city));

    const cityVenueIds = cityVenues.map((v) => v.id);
    if (cityVenueIds.length === 0) return [];

    // Merge with any existing venue filter
    if (venueIds && venueIds.length > 0) {
      const intersection = cityVenueIds.filter((id) => venueIds.includes(id));
      if (intersection.length === 0) return [];
      conditions.push(inArray(events.venueId, intersection));
    } else {
      conditions.push(inArray(events.venueId, cityVenueIds));
    }
  }

  if (minBuyScore) {
    // Get event IDs with sufficient buy scores
    const scoreRows = await db
      .select({ eventId: eventScores.eventId })
      .from(eventScores)
      .where(sql`CAST(${eventScores.buyScore} AS numeric) >= ${minBuyScore}`);

    const scoreEventIds = scoreRows.map((r) => r.eventId);
    if (scoreEventIds.length === 0) return [];
    conditions.push(inArray(events.id, scoreEventIds));
  }

  const orderBy =
    sort === "date_desc"
      ? desc(events.eventDate)
      : sort === "newest"
      ? desc(events.createdAt)
      : sort === "name"
      ? asc(events.name)
      : asc(events.eventDate);

  const rows = await db.query.events.findMany({
    where: and(...conditions),
    orderBy,
    limit,
    offset,
    with: {
      venue: true,
      artists: {
        with: { artist: true },
      },
    },
  });

  return rows;
}

// ---------------------------------------------------------------------------
// getEventCount — count events matching filters (for pagination)
// ---------------------------------------------------------------------------

export async function getEventCount(opts: EventFilterOpts): Promise<number> {
  const {
    venueIds,
    statuses,
    genres,
    segment,
    search,
    minBuyScore,
    city,
  } = opts;

  const now = new Date();
  const conditions = [gte(events.eventDate, now)];

  if (venueIds && venueIds.length > 0) {
    conditions.push(inArray(events.venueId, venueIds));
  }
  if (statuses && statuses.length > 0) {
    conditions.push(inArray(events.status, statuses));
  }
  if (genres && genres.length > 0) {
    conditions.push(inArray(events.genre, genres));
  }
  if (segment) {
    conditions.push(eq(events.segment, segment));
  }
  if (search) {
    conditions.push(ilike(events.name, `%${search}%`));
  }
  if (city) {
    const cityVenues = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.city, city));
    const cityVenueIds = cityVenues.map((v) => v.id);
    if (cityVenueIds.length === 0) return 0;
    conditions.push(inArray(events.venueId, cityVenueIds));
  }
  if (minBuyScore) {
    const scoreRows = await db
      .select({ eventId: eventScores.eventId })
      .from(eventScores)
      .where(sql`CAST(${eventScores.buyScore} AS numeric) >= ${minBuyScore}`);
    const scoreEventIds = scoreRows.map((r) => r.eventId);
    if (scoreEventIds.length === 0) return 0;
    conditions.push(inArray(events.id, scoreEventIds));
  }

  const [result] = await db
    .select({ count: count() })
    .from(events)
    .where(and(...conditions));

  return result.count;
}

// ---------------------------------------------------------------------------
// getEventFilterOptions — distinct values for filter dropdowns
// ---------------------------------------------------------------------------

export async function getEventFilterOptions() {
  const now = new Date();
  const futureCondition = gte(events.eventDate, now);

  // Venues with future events
  const venueRows = await db
    .selectDistinct({ id: venues.id, name: venues.name })
    .from(events)
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(futureCondition)
    .orderBy(asc(venues.name));

  // Genres
  const genreRows = await db
    .selectDistinct({ genre: events.genre })
    .from(events)
    .where(and(futureCondition, sql`${events.genre} IS NOT NULL`))
    .orderBy(asc(events.genre));

  // Segments
  const segmentRows = await db
    .selectDistinct({ segment: events.segment })
    .from(events)
    .where(and(futureCondition, sql`${events.segment} IS NOT NULL`))
    .orderBy(asc(events.segment));

  // Statuses with counts
  const statusRows = await db
    .select({ status: events.status, count: count() })
    .from(events)
    .where(futureCondition)
    .groupBy(events.status)
    .orderBy(asc(events.status));

  // Cities
  const cityRows = await db
    .selectDistinct({ city: venues.city })
    .from(events)
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(and(futureCondition, sql`${venues.city} IS NOT NULL`))
    .orderBy(asc(venues.city));

  return {
    venues: venueRows,
    genres: genreRows.map((r) => r.genre!),
    segments: segmentRows.map((r) => r.segment!),
    statuses: statusRows,
    cities: cityRows.map((r) => r.city).filter(Boolean) as string[],
  };
}

// ---------------------------------------------------------------------------
// upsertEventFromTM — insert or update an event from Ticketmaster data
// ---------------------------------------------------------------------------

export async function upsertEventFromTM(
  normalized: NormalizedEvent
): Promise<{ created: number; updated: number; createdEventId: number | null }> {
  // Check if we already have this TM event
  const [existingSource] = await db
    .select({ eventId: eventSources.eventId })
    .from(eventSources)
    .where(
      and(
        eq(eventSources.source, "ticketmaster"),
        eq(eventSources.sourceEventId, normalized.sourceEventId)
      )
    )
    .limit(1);

  if (existingSource) {
    // Update existing event
    await db
      .update(events)
      .set({
        name: normalized.name,
        eventDate: normalized.eventDate,
        eventEndDate: normalized.eventEndDate,
        genre: normalized.genre,
        subGenre: normalized.subGenre,
        segment: normalized.segment,
        imageUrl: normalized.imageUrl,
        status: normalized.status,
        priceMin: normalized.priceMin,
        priceMax: normalized.priceMax,
        currency: normalized.currency,
        lastScannedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(events.id, existingSource.eventId));

    // Upsert onsale windows
    await syncOnsaleWindows(existingSource.eventId, normalized.onsaleWindows);

    return { created: 0, updated: 1, createdEventId: null };
  }

  // Resolve venue
  let venueId: number | null = null;
  if (normalized.tmVenueId) {
    const [venue] = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.tmVenueId, normalized.tmVenueId))
      .limit(1);
    venueId = venue?.id ?? null;
  }

  // Create event
  const [newEvent] = await db
    .insert(events)
    .values({
      name: normalized.name,
      slug: normalized.slug,
      venueId,
      eventDate: normalized.eventDate,
      eventEndDate: normalized.eventEndDate,
      genre: normalized.genre,
      subGenre: normalized.subGenre,
      segment: normalized.segment,
      imageUrl: normalized.imageUrl,
      status: normalized.status,
      priceMin: normalized.priceMin,
      priceMax: normalized.priceMax,
      currency: normalized.currency,
      lastScannedAt: new Date(),
    })
    .onConflictDoNothing({ target: events.slug })
    .returning({ id: events.id });

  if (!newEvent) {
    // Slug conflict — event exists with different source, try to link
    const [bySlug] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, normalized.slug))
      .limit(1);

    if (bySlug) {
      await db
        .insert(eventSources)
        .values({
          eventId: bySlug.id,
          source: "ticketmaster",
          sourceEventId: normalized.sourceEventId,
          sourceUrl: normalized.sourceUrl,
        })
        .onConflictDoNothing();

      return { created: 0, updated: 0, createdEventId: null };
    }

    return { created: 0, updated: 0, createdEventId: null };
  }

  const eventId = newEvent.id;

  // Create event source link
  await db
    .insert(eventSources)
    .values({
      eventId,
      source: "ticketmaster",
      sourceEventId: normalized.sourceEventId,
      sourceUrl: normalized.sourceUrl,
    })
    .onConflictDoNothing();

  // Upsert artists
  for (let i = 0; i < normalized.artists.length; i++) {
    const a = normalized.artists[i];

    // Find or create artist
    let [artist] = await db
      .select({ id: artists.id })
      .from(artists)
      .where(eq(artists.tmAttractionId, a.tmAttractionId))
      .limit(1);

    if (!artist) {
      [artist] = await db
        .insert(artists)
        .values({
          name: a.name,
          slug: a.slug,
          normalizedName: a.normalizedName,
          tmAttractionId: a.tmAttractionId,
          genre: a.genre,
          imageUrl: a.imageUrl,
        })
        .onConflictDoNothing({ target: artists.slug })
        .returning({ id: artists.id });

      if (!artist) {
        // Slug conflict — find by slug
        [artist] = await db
          .select({ id: artists.id })
          .from(artists)
          .where(eq(artists.slug, a.slug))
          .limit(1);
      }
    }

    if (artist) {
      await db
        .insert(eventArtists)
        .values({
          eventId,
          artistId: artist.id,
          isPrimary: i === 0,
        })
        .onConflictDoNothing();
    }
  }

  // Create onsale windows
  await syncOnsaleWindows(eventId, normalized.onsaleWindows);

  return { created: 1, updated: 0, createdEventId: eventId };
}

async function syncOnsaleWindows(
  eventId: number,
  windows: NormalizedEvent["onsaleWindows"]
) {
  if (windows.length === 0) return;

  // Delete existing windows and re-insert
  await db.delete(onsaleWindows).where(eq(onsaleWindows.eventId, eventId));

  await db.insert(onsaleWindows).values(
    windows.map((w) => ({
      eventId,
      windowType: w.windowType,
      windowName: w.windowName,
      startDate: w.startDate,
      endDate: w.endDate,
      signupUrl: w.signupUrl,
    }))
  );
}
