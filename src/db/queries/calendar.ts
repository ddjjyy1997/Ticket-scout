import { db } from "@/db";
import { events, onsaleWindows, venues, eventArtists, artists } from "@/db/schema";
import { eq, and, gte, lte, asc, inArray } from "drizzle-orm";

export interface CalendarEvent {
  id: number;
  name: string;
  slug: string;
  eventDate: Date;
  genre: string | null;
  status: string;
  imageUrl: string | null;
  venueName: string | null;
  artists: string[];
}

export interface CalendarOnsale {
  windowId: number;
  windowType: string;
  windowName: string | null;
  startDate: Date;
  eventId: number;
  eventName: string;
  eventSlug: string;
  eventDate: Date;
  venueName: string | null;
}

export async function getCalendarEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
  const rows = await db
    .select({
      id: events.id,
      name: events.name,
      slug: events.slug,
      eventDate: events.eventDate,
      genre: events.genre,
      status: events.status,
      imageUrl: events.imageUrl,
      venueName: venues.name,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(gte(events.eventDate, from), lte(events.eventDate, to)))
    .orderBy(asc(events.eventDate));

  const eventIds = rows.map((r) => r.id);
  const artistsByEvent = new Map<number, string[]>();

  if (eventIds.length > 0) {
    const artistRows = await db
      .select({
        eventId: eventArtists.eventId,
        name: artists.name,
      })
      .from(eventArtists)
      .innerJoin(artists, eq(eventArtists.artistId, artists.id))
      .where(inArray(eventArtists.eventId, eventIds));

    for (const a of artistRows) {
      const list = artistsByEvent.get(a.eventId) ?? [];
      list.push(a.name);
      artistsByEvent.set(a.eventId, list);
    }
  }

  return rows.map((r) => ({
    ...r,
    artists: artistsByEvent.get(r.id) ?? [],
  }));
}

export async function getCalendarOnsales(from: Date, to: Date): Promise<CalendarOnsale[]> {
  return db
    .select({
      windowId: onsaleWindows.id,
      windowType: onsaleWindows.windowType,
      windowName: onsaleWindows.windowName,
      startDate: onsaleWindows.startDate,
      eventId: events.id,
      eventName: events.name,
      eventSlug: events.slug,
      eventDate: events.eventDate,
      venueName: venues.name,
    })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(gte(onsaleWindows.startDate, from), lte(onsaleWindows.startDate, to)))
    .orderBy(asc(onsaleWindows.startDate));
}
