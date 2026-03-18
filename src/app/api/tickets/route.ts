import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  userTickets,
  events,
  venues,
  eventScores,
  resaleListingsSummary,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan =
    (session.user as { role?: string }).role === "admin"
      ? "pro"
      : ((session.user as { plan?: string }).plan ?? "free");
  if (plan !== "pro") {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const tickets = await db
    .select({
      id: userTickets.id,
      section: userTickets.section,
      row: userTickets.row,
      seat: userTickets.seat,
      quantity: userTickets.quantity,
      purchasePrice: userTickets.purchasePrice,
      purchaseCurrency: userTickets.purchaseCurrency,
      purchaseDate: userTickets.purchaseDate,
      source: userTickets.source,
      notes: userTickets.notes,
      createdAt: userTickets.createdAt,
      eventId: events.id,
      eventName: events.name,
      eventSlug: events.slug,
      eventDate: events.eventDate,
      eventImageUrl: events.imageUrl,
      eventStatus: events.status,
      eventPriceMin: events.priceMin,
      venueName: venues.name,
      buyScore: eventScores.buyScore,
      sellScore: eventScores.sellScore,
      sellRecommendation: eventScores.sellRecommendation,
      marketPhase: eventScores.marketPhase,
      profitEstimatePct: eventScores.profitEstimatePct,
      lowestResale: resaleListingsSummary.lowestPrice,
      medianResale: resaleListingsSummary.medianPrice,
      listingCount: resaleListingsSummary.listingCount,
    })
    .from(userTickets)
    .innerJoin(events, eq(userTickets.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(eventScores, eq(eventScores.eventId, events.id))
    .leftJoin(
      resaleListingsSummary,
      and(
        eq(resaleListingsSummary.eventId, events.id),
        // Get latest snapshot only - we'll pick the most recent in app logic
      )
    )
    .where(eq(userTickets.userId, session.user.id))
    .orderBy(desc(userTickets.createdAt));

  // Deduplicate resale rows (keep latest per ticket)
  const seen = new Set<number>();
  const deduped = tickets.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  return NextResponse.json(deduped);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan =
    (session.user as { role?: string }).role === "admin"
      ? "pro"
      : ((session.user as { plan?: string }).plan ?? "free");
  if (plan !== "pro") {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.eventId || !body?.purchasePrice) {
    return NextResponse.json(
      { error: "eventId and purchasePrice required" },
      { status: 400 }
    );
  }

  const [ticket] = await db
    .insert(userTickets)
    .values({
      userId: session.user.id,
      eventId: body.eventId,
      section: body.section ?? null,
      row: body.row ?? null,
      seat: body.seat ?? null,
      quantity: body.quantity ?? 1,
      purchasePrice: String(body.purchasePrice),
      purchaseCurrency: body.purchaseCurrency ?? "CAD",
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
      source: body.source ?? "manual",
      notes: body.notes ?? null,
    })
    .returning();

  return NextResponse.json(ticket, { status: 201 });
}
