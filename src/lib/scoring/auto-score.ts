import { db } from "@/db";
import { events, eventScores, eventArtists, onsaleWindows, venues } from "@/db/schema";
import { eq, and, sql, isNull, gte, inArray } from "drizzle-orm";
import { computeBuyScore } from "@/lib/scoring";

/**
 * Auto-score an event using only TM data (no SeatGeek API calls).
 * Called during scanning for immediate scoring.
 */
export async function autoScoreEvent(eventId: number): Promise<void> {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || !event.eventDate || event.eventDate < new Date()) return;

  // Get venue capacity
  let venueCapacity: number | null = null;
  if (event.venueId) {
    const [venue] = await db
      .select({ capacity: venues.capacity })
      .from(venues)
      .where(eq(venues.id, event.venueId))
      .limit(1);
    venueCapacity = venue?.capacity ?? null;
  }

  // Count artists
  const artistRows = await db
    .select({ id: eventArtists.artistId })
    .from(eventArtists)
    .where(eq(eventArtists.eventId, eventId));

  // Get onsale windows
  const windows = await db
    .select({ windowType: onsaleWindows.windowType, startDate: onsaleWindows.startDate })
    .from(onsaleWindows)
    .where(eq(onsaleWindows.eventId, eventId));

  // Count same-artist-same-venue events (multi-night detection)
  let sameArtistSameVenueCount = 0;
  if (event.venueId && artistRows.length > 0) {
    const artistIds = artistRows.map((a) => a.id);
    const sameVenueArtistEvents = await db
      .selectDistinct({ eventId: eventArtists.eventId })
      .from(eventArtists)
      .innerJoin(events, eq(eventArtists.eventId, events.id))
      .where(
        and(
          inArray(eventArtists.artistId, artistIds),
          eq(events.venueId, event.venueId),
          sql`${events.id} != ${eventId}`,
          gte(events.eventDate, new Date())
        )
      );
    sameArtistSameVenueCount = sameVenueArtistEvents.length;
  }

  // Compute buy score using existing scoring engine
  // Pass null for SG fields — the scoring engine handles this with venue/genre/price signals
  const buyResult = computeBuyScore({
    eventDate: event.eventDate,
    status: event.status,
    genre: event.genre,
    venueCapacity,
    artistCount: artistRows.length,
    onsaleWindows: windows.map((w) => ({
      windowType: w.windowType,
      startDate: w.startDate,
    })),
    createdAt: event.createdAt,
    sgPerformerScore: null,
    sgEventScore: null,
    matchConfidence: null,
    sameArtistSameVenueCount,
  });

  // Upsert score
  await db
    .insert(eventScores)
    .values({
      eventId,
      buyScore: buyResult.buyScore.toString(),
      buyConfidence: buyResult.buyConfidence.toString(),
      buyInputs: buyResult.components,
      buyRecommendation: buyResult.recommendation,
      expectedRoiBand: buyResult.expectedRoiBand,
      calculatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: eventScores.eventId,
      set: {
        buyScore: buyResult.buyScore.toString(),
        buyConfidence: buyResult.buyConfidence.toString(),
        buyInputs: buyResult.components,
        buyRecommendation: buyResult.recommendation,
        expectedRoiBand: buyResult.expectedRoiBand,
        calculatedAt: new Date(),
      },
    });
}

/**
 * Re-score ALL future events (not just unscored).
 */
export async function backfillEventScores(): Promise<number> {
  const allFutureEvents = await db
    .select({ id: events.id })
    .from(events)
    .where(gte(events.eventDate, new Date()));

  let scored = 0;
  for (const event of allFutureEvents) {
    try {
      await autoScoreEvent(event.id);
      scored++;
    } catch {
      // Skip failures
    }
  }
  return scored;
}
