import { db } from "@/db";
import {
  events,
  onsaleWindows,
  venues,
  eventArtists,
  artists,
} from "@/db/schema";
import { eq, and, gte, lte, asc, count, ilike, sql, inArray } from "drizzle-orm";
import { format } from "date-fns";

export interface PresaleWindow {
  id: number;
  windowType: string;
  windowName: string | null;
  startDate: Date;
  endDate: Date | null;
  signupUrl: string | null;
}

export interface GroupedPresaleRow {
  event: {
    id: number;
    name: string;
    slug: string;
    eventDate: Date;
    genre: string | null;
    subGenre: string | null;
    imageUrl: string | null;
    status: string;
    priceMin: string | null;
    priceMax: string | null;
    currency: string | null;
  };
  venue: {
    id: number;
    name: string;
  } | null;
  artists: { name: string; isPrimary: boolean | null }[];
  windows: PresaleWindow[];
  earliestStart: Date;
  buyScore: number | null;
}

export interface PresaleFilterOptions {
  limit?: number;
  offset?: number;
  venueIds?: number[];
  genres?: string[];
  segment?: string;
  search?: string;
  windowType?: "all" | "presale" | "general";
  sort?: string;
  minScore?: number;
  from?: Date;
  to?: Date;
  city?: string;
}

export async function getUpcomingPresales(options?: PresaleFilterOptions): Promise<GroupedPresaleRow[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const now = new Date();
  // minScore filter added below in conditions

  const conditions = [gte(onsaleWindows.startDate, now)];

  if (options?.windowType && options.windowType !== "all") {
    conditions.push(eq(onsaleWindows.windowType, options.windowType));
  }
  if (options?.venueIds && options.venueIds.length > 0) {
    conditions.push(inArray(events.venueId, options.venueIds));
  }
  if (options?.genres && options.genres.length > 0) {
    conditions.push(inArray(events.genre, options.genres));
  }
  if (options?.segment && options.segment !== "all") {
    conditions.push(eq(events.segment, options.segment));
  }
  if (options?.search) {
    conditions.push(ilike(events.name, `%${options.search}%`));
  }
  if (options?.city) {
    conditions.push(eq(venues.city, options.city));
  }
  if (options?.minScore) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM event_scores WHERE event_scores.event_id = ${events.id} AND event_scores.buy_score >= ${options.minScore})`
    );
  }
  if (options?.from) {
    conditions.push(gte(onsaleWindows.startDate, options.from));
  }
  if (options?.to) {
    conditions.push(lte(onsaleWindows.startDate, options.to));
  }

  // Fetch all matching windows
  const rows = await db
    .select({
      windowId: onsaleWindows.id,
      windowType: onsaleWindows.windowType,
      windowName: onsaleWindows.windowName,
      windowStart: onsaleWindows.startDate,
      windowEnd: onsaleWindows.endDate,
      windowSignupUrl: onsaleWindows.signupUrl,
      eventId: events.id,
      eventName: events.name,
      eventSlug: events.slug,
      eventDate: events.eventDate,
      genre: events.genre,
      subGenre: events.subGenre,
      imageUrl: events.imageUrl,
      status: events.status,
      priceMin: events.priceMin,
      priceMax: events.priceMax,
      currency: events.currency,
      venueId: venues.id,
      venueName: venues.name,
      buyScore: sql<number | null>`(SELECT buy_score FROM event_scores WHERE event_scores.event_id = ${events.id} LIMIT 1)`,
    })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(...conditions))
    .orderBy(asc(onsaleWindows.startDate));

  // Group by event+day: key = "eventId-YYYY-MM-DD"
  const grouped = new Map<string, {
    event: GroupedPresaleRow["event"];
    venue: GroupedPresaleRow["venue"];
    windows: PresaleWindow[];
    earliestStart: Date;
    buyScore: number | null;
  }>();

  for (const r of rows) {
    const dayKey = `${r.eventId}-${format(r.windowStart, "yyyy-MM-dd")}`;

    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, {
        event: {
          id: r.eventId,
          name: r.eventName,
          slug: r.eventSlug,
          eventDate: r.eventDate,
          genre: r.genre,
          subGenre: r.subGenre,
          imageUrl: r.imageUrl,
          status: r.status,
          priceMin: r.priceMin,
          priceMax: r.priceMax,
          currency: r.currency,
        },
        venue: r.venueId ? { id: r.venueId, name: r.venueName! } : null,
        buyScore: r.buyScore ? Number(r.buyScore) : null,
        windows: [],
        earliestStart: r.windowStart,
      });
    }

    const group = grouped.get(dayKey)!;
    group.windows.push({
      id: r.windowId,
      windowType: r.windowType,
      windowName: r.windowName,
      startDate: r.windowStart,
      endDate: r.windowEnd,
      signupUrl: r.windowSignupUrl,
    });
    if (r.windowStart < group.earliestStart) {
      group.earliestStart = r.windowStart;
    }
  }

  // Sort based on option
  const allGroups = [...grouped.values()];
  const sorted = allGroups.sort((a, b) => {
    switch (options?.sort) {
      case "date_desc":
        return b.earliestStart.getTime() - a.earliestStart.getTime();
      case "event_asc":
        return a.event.eventDate.getTime() - b.event.eventDate.getTime();
      case "newest":
        return b.event.id - a.event.id;
      case "name":
        return a.event.name.localeCompare(b.event.name);
      case "date_asc":
      default:
        return a.earliestStart.getTime() - b.earliestStart.getTime();
    }
  });

  const paginated = sorted.slice(offset, offset + limit);

  // Fetch artists for these events
  const eventIds = [...new Set(paginated.map((r) => r.event.id))];
  const artistsByEvent = new Map<number, { name: string; isPrimary: boolean | null }[]>();

  if (eventIds.length > 0) {
    const artistRows = await db
      .select({
        eventId: eventArtists.eventId,
        name: artists.name,
        isPrimary: eventArtists.isPrimary,
      })
      .from(eventArtists)
      .innerJoin(artists, eq(eventArtists.artistId, artists.id))
      .where(inArray(eventArtists.eventId, eventIds));

    for (const a of artistRows) {
      const list = artistsByEvent.get(a.eventId) ?? [];
      list.push({ name: a.name, isPrimary: a.isPrimary });
      artistsByEvent.set(a.eventId, list);
    }
  }

  return paginated.map((g) => ({
    ...g,
    artists: artistsByEvent.get(g.event.id) ?? [],
  }));
}

export async function getPresaleCount(options?: PresaleFilterOptions): Promise<number> {
  const now = new Date();
  const conditions = [gte(onsaleWindows.startDate, now)];

  if (options?.windowType && options.windowType !== "all") {
    conditions.push(eq(onsaleWindows.windowType, options.windowType));
  }
  if (options?.venueIds && options.venueIds.length > 0) {
    conditions.push(inArray(events.venueId, options.venueIds));
  }
  if (options?.genres && options.genres.length > 0) {
    conditions.push(inArray(events.genre, options.genres));
  }
  if (options?.segment && options.segment !== "all") {
    conditions.push(eq(events.segment, options.segment));
  }
  if (options?.search) {
    conditions.push(ilike(events.name, `%${options.search}%`));
  }
  if (options?.city) {
    conditions.push(eq(venues.city, options.city));
  }
  if (options?.minScore) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM event_scores WHERE event_scores.event_id = ${events.id} AND event_scores.buy_score >= ${options.minScore})`
    );
  }
  if (options?.from) {
    conditions.push(gte(onsaleWindows.startDate, options.from));
  }
  if (options?.to) {
    conditions.push(lte(onsaleWindows.startDate, options.to));
  }

  // Count distinct event+day combinations
  const [result] = await db
    .select({
      count: sql<number>`COUNT(DISTINCT (${events.id} || '-' || TO_CHAR(${onsaleWindows.startDate}, 'YYYY-MM-DD')))`,
    })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(...conditions));

  return Number(result.count);
}

export async function getPresaleFilterOptions() {
  const now = new Date();

  const venueList = await db
    .selectDistinct({ id: venues.id, name: venues.name })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(gte(onsaleWindows.startDate, now))
    .orderBy(asc(venues.name));

  const genreRows = await db
    .selectDistinct({ genre: events.genre })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .where(and(gte(onsaleWindows.startDate, now), sql`${events.genre} IS NOT NULL`))
    .orderBy(asc(events.genre));

  const segmentRows = await db
    .selectDistinct({ segment: events.segment })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .where(and(gte(onsaleWindows.startDate, now), sql`${events.segment} IS NOT NULL`))
    .orderBy(asc(events.segment));

  const cityRows = await db
    .selectDistinct({ city: venues.city })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(gte(onsaleWindows.startDate, now))
    .orderBy(asc(venues.city));

  return {
    venues: venueList,
    genres: genreRows.map((r) => r.genre).filter(Boolean) as string[],
    segments: segmentRows.map((r) => r.segment).filter(Boolean) as string[],
    cities: cityRows.map((r) => r.city).filter(Boolean) as string[],
  };
}
