import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  events,
  resaleListingsSummary,
  eventScores,
  venues,
  onsaleWindows,
  eventArtists,
  artists,
} from "@/db/schema";
import { eq, desc, asc, and, inArray, sql } from "drizzle-orm";
import { findSeatGeekMatch } from "@/lib/matching/event-matcher";
import { CACHE_TTL } from "@/lib/constants";
import { computeBuyScore, computeSellScore } from "@/lib/scoring";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const eventId = parseInt(id);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  // Get event
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Check cache — return if snapshot < 1 hour old
  const [recentSnapshot] = await db
    .select()
    .from(resaleListingsSummary)
    .where(eq(resaleListingsSummary.eventId, eventId))
    .orderBy(desc(resaleListingsSummary.snapshotDate))
    .limit(1);

  if (recentSnapshot) {
    const age = Date.now() - recentSnapshot.snapshotDate.getTime();
    if (age < CACHE_TTL.resalePricing) {
      const [scores] = await db
        .select()
        .from(eventScores)
        .where(eq(eventScores.eventId, eventId))
        .limit(1);

      return NextResponse.json({
        cached: true,
        resale: recentSnapshot,
        buy: scores
          ? {
              buyScore: parseFloat(scores.buyScore ?? "0"),
              buyConfidence: parseFloat(scores.buyConfidence),
              recommendation: scores.buyRecommendation,
              expectedRoiBand: scores.expectedRoiBand,
              components: scores.buyInputs,
            }
          : null,
        sell: scores?.sellScore
          ? {
              sellScore: parseFloat(scores.sellScore),
              sellConfidence: parseFloat(scores.sellConfidence),
              recommendation: scores.sellRecommendation,
              marketPhase: scores.marketPhase,
              profitEstimatePct: scores.profitEstimatePct
                ? parseFloat(scores.profitEstimatePct)
                : null,
              profitEstimateAmt: scores.profitEstimateAmt
                ? parseFloat(scores.profitEstimateAmt)
                : null,
              components: scores.sellInputs,
            }
          : null,
        sgUrl:
          (recentSnapshot.rawData as Record<string, unknown>)?.sgUrl ?? null,
      });
    }
  }

  // Get venue info
  let venue = null;
  if (event.venueId) {
    [venue] = await db
      .select()
      .from(venues)
      .where(eq(venues.id, event.venueId))
      .limit(1);
  }

  // Get artists
  const eventArtistRows = await db
    .select({ name: artists.name, artistId: artists.id })
    .from(eventArtists)
    .innerJoin(artists, eq(eventArtists.artistId, artists.id))
    .where(eq(eventArtists.eventId, eventId));

  // Get onsale windows
  const windows = await db
    .select()
    .from(onsaleWindows)
    .where(eq(onsaleWindows.eventId, eventId));

  // Multi-night detection: count events sharing ≥1 artist AND same venue
  let sameArtistSameVenueCount = 0;
  if (event.venueId && eventArtistRows.length > 0) {
    const artistIds = eventArtistRows.map((a) => a.artistId);
    const sameVenueArtistEvents = await db
      .selectDistinct({ eventId: eventArtists.eventId })
      .from(eventArtists)
      .innerJoin(events, eq(eventArtists.eventId, events.id))
      .where(
        and(
          inArray(eventArtists.artistId, artistIds),
          eq(events.venueId, event.venueId),
          sql`${events.id} != ${eventId}`,
          sql`${events.eventDate} > NOW()`
        )
      );
    sameArtistSameVenueCount = sameVenueArtistEvents.length;
  }

  // Try to match on SeatGeek
  const match = await findSeatGeekMatch({
    name: event.name,
    eventDate: event.eventDate,
    venueSlug: venue?.slug ?? undefined,
    venueName: venue?.name ?? undefined,
    artistNames: eventArtistRows.map((a) => a.name),
  });

  let resaleSnapshot = null;

  if (match) {
    const stats = match.sgEvent.stats;

    const [inserted] = await db
      .insert(resaleListingsSummary)
      .values({
        eventId,
        source: "seatgeek",
        listingCount: stats.listing_count,
        lowestPrice: stats.lowest_price?.toString() ?? null,
        highestPrice: stats.highest_price?.toString() ?? null,
        averagePrice: stats.average_price?.toString() ?? null,
        medianPrice: stats.median_price?.toString() ?? null,
        sgScore: match.sgEvent.score?.toString() ?? null,
        currency: "USD",
        rawData: {
          sgEventId: match.sgEvent.id,
          sgUrl: match.sgEvent.url,
          matchConfidence: match.confidence,
          matchDetails: match.matchDetails,
        },
      })
      .returning();

    resaleSnapshot = inserted;
  }

  // Fetch previous snapshots for momentum calculation
  const allSnapshots = await db
    .select({
      snapshotDate: resaleListingsSummary.snapshotDate,
      lowestPrice: resaleListingsSummary.lowestPrice,
      medianPrice: resaleListingsSummary.medianPrice,
      listingCount: resaleListingsSummary.listingCount,
    })
    .from(resaleListingsSummary)
    .where(eq(resaleListingsSummary.eventId, eventId))
    .orderBy(asc(resaleListingsSummary.snapshotDate));

  // Previous = all except the most recent (current)
  const previousSnapshots = allSnapshots.slice(0, -1).map((s) => ({
    snapshotDate: s.snapshotDate,
    lowestPrice: s.lowestPrice ? parseFloat(s.lowestPrice) : null,
    medianPrice: s.medianPrice ? parseFloat(s.medianPrice) : null,
    listingCount: s.listingCount,
  }));

  // Compute BUY score (always works, with or without SG data)
  const buyResult = computeBuyScore({
    eventDate: event.eventDate,
    status: event.status,
    genre: event.genre,
    venueCapacity: venue?.capacity ?? null,
    artistCount: eventArtistRows.length,
    onsaleWindows: windows.map((w) => ({
      windowType: w.windowType,
      startDate: w.startDate,
    })),
    createdAt: event.createdAt,
    sgPerformerScore: match?.sgEvent.performers[0]?.score ?? null,
    sgEventScore: match?.sgEvent.score ?? null,
    matchConfidence: match?.confidence ?? null,
    sameArtistSameVenueCount,
  });

  // Compute SELL score (only if SG match exists)
  const sellResult = match
    ? computeSellScore({
        faceValueMin: event.priceMin ? parseFloat(event.priceMin) : null,
        faceValueMax: event.priceMax ? parseFloat(event.priceMax) : null,
        lowestResalePrice: match.sgEvent.stats.lowest_price,
        medianResalePrice: match.sgEvent.stats.median_price,
        averageResalePrice: match.sgEvent.stats.average_price,
        highestResalePrice: match.sgEvent.stats.highest_price,
        listingCount: match.sgEvent.stats.listing_count,
        sgEventScore: match.sgEvent.score,
        previousSnapshots,
        eventDate: event.eventDate,
        status: event.status,
        onsaleWindows: windows.map((w) => ({
          windowType: w.windowType,
          startDate: w.startDate,
        })),
        matchConfidence: match.confidence,
      })
    : null;

  // Upsert scores
  const scoreData = {
    buyScore: buyResult.buyScore.toString(),
    buyConfidence: buyResult.buyConfidence.toString(),
    buyInputs: buyResult.components,
    buyRecommendation: buyResult.recommendation,
    expectedRoiBand: buyResult.expectedRoiBand,
    sellScore: sellResult?.sellScore.toString() ?? null,
    sellConfidence: (sellResult?.sellConfidence ?? 0).toString(),
    sellInputs: sellResult?.components ?? {},
    sellRecommendation: sellResult?.recommendation ?? null,
    marketPhase: sellResult?.marketPhase ?? null,
    profitEstimatePct: sellResult?.profitEstimatePct?.toString() ?? null,
    profitEstimateAmt: sellResult?.profitEstimateAmt?.toString() ?? null,
    calculatedAt: new Date(),
  };

  await db
    .insert(eventScores)
    .values({ eventId, ...scoreData })
    .onConflictDoUpdate({
      target: eventScores.eventId,
      set: scoreData,
    });

  return NextResponse.json({
    cached: false,
    matched: !!match,
    matchConfidence: match?.confidence ?? null,
    resale: resaleSnapshot,
    buy: buyResult,
    sell: sellResult,
    sgUrl: match?.sgEvent.url ?? null,
  });
}
