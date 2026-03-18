import { db } from "@/db";
import { events, onsaleWindows, venues, eventArtists, artists, scanRuns } from "@/db/schema";
import { eq, gte, lte, and, count, desc, sql, ne } from "drizzle-orm";

export async function getDashboardStats() {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Total future events
  const [totalResult] = await db
    .select({ count: count() })
    .from(events)
    .where(gte(events.eventDate, now));

  // Upcoming onsales (all windows in next 7 days — presales + general)
  const [onsaleResult] = await db
    .select({ count: count() })
    .from(onsaleWindows)
    .where(
      and(
        gte(onsaleWindows.startDate, now),
        lte(onsaleWindows.startDate, weekFromNow)
      )
    );

  // Recently added (last 24 hours)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [recentResult] = await db
    .select({ count: count() })
    .from(events)
    .where(gte(events.createdAt, yesterday));

  // Last scan
  const [lastScan] = await db
    .select({
      id: scanRuns.id,
      status: scanRuns.status,
      eventsFound: scanRuns.eventsFound,
      eventsCreated: scanRuns.eventsCreated,
      completedAt: scanRuns.completedAt,
      durationMs: scanRuns.durationMs,
    })
    .from(scanRuns)
    .orderBy(desc(scanRuns.startedAt))
    .limit(1);

  return {
    totalEvents: totalResult.count,
    upcomingOnsales: onsaleResult.count,
    recentlyAdded: recentResult.count,
    lastScan: lastScan ?? null,
  };
}

export async function getRecentEvents(limit = 10) {
  return db.query.events.findMany({
    where: gte(events.eventDate, new Date()),
    orderBy: desc(events.createdAt),
    limit,
    with: {
      venue: true,
      artists: {
        with: { artist: true },
      },
    },
  });
}

export async function getUpcomingOnsales(limit = 10) {
  const now = new Date();
  const rows = await db
    .select({
      windowId: onsaleWindows.id,
      windowType: onsaleWindows.windowType,
      windowName: onsaleWindows.windowName,
      startDate: onsaleWindows.startDate,
      endDate: onsaleWindows.endDate,
      eventId: events.id,
      eventName: events.name,
      eventSlug: events.slug,
      eventDate: events.eventDate,
      venueName: venues.name,
    })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(gte(onsaleWindows.startDate, now))
    .orderBy(onsaleWindows.startDate)
    .limit(limit);

  return rows;
}
