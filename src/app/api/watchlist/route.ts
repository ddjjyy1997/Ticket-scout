import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { watchlists, watchlistItems, artists, venues, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get or create default watchlist
  let [watchlist] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, session.user.id))
    .limit(1);

  if (!watchlist) {
    [watchlist] = await db
      .insert(watchlists)
      .values({ userId: session.user.id, name: "Default" })
      .returning();
  }

  // Get items with related data
  const items = await db.query.watchlistItems.findMany({
    where: eq(watchlistItems.watchlistId, watchlist.id),
    with: {
      artist: true,
      venue: true,
      event: true,
    },
    orderBy: (item, { desc }) => [desc(item.createdAt)],
  });

  return NextResponse.json({ watchlist, items });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { itemType, artistId, venueId, eventId } = body;

  if (!itemType || !["artist", "venue", "event"].includes(itemType)) {
    return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
  }

  // Get or create default watchlist
  let [watchlist] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, session.user.id))
    .limit(1);

  if (!watchlist) {
    [watchlist] = await db
      .insert(watchlists)
      .values({ userId: session.user.id, name: "Default" })
      .returning();
  }

  try {
    const [item] = await db
      .insert(watchlistItems)
      .values({
        watchlistId: watchlist.id,
        itemType,
        artistId: itemType === "artist" ? artistId : null,
        venueId: itemType === "venue" ? venueId : null,
        eventId: itemType === "event" ? eventId : null,
      })
      .returning();

    return NextResponse.json({ item });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("unique")) {
      return NextResponse.json(
        { error: "Already in watchlist" },
        { status: 409 }
      );
    }
    throw e;
  }
}
