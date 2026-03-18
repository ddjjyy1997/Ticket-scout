import { auth } from "@/lib/auth";
import { db } from "@/db";
import { watchlists, watchlistItems, savedViews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { WatchlistClient } from "./watchlist-client";

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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

  const [items, views] = await Promise.all([
    db.query.watchlistItems.findMany({
      where: eq(watchlistItems.watchlistId, watchlist.id),
      with: {
        artist: true,
        venue: true,
        event: true,
      },
      orderBy: (item, { desc }) => [desc(item.createdAt)],
    }),
    db
      .select()
      .from(savedViews)
      .where(eq(savedViews.userId, session.user.id))
      .orderBy(desc(savedViews.createdAt)),
  ]);

  const initialItems = items.map((item) => ({
    id: item.id,
    itemType: item.itemType,
    createdAt: item.createdAt.toISOString(),
    artist: item.artist
      ? { id: item.artist.id, name: item.artist.name, genre: item.artist.genre, imageUrl: item.artist.imageUrl }
      : null,
    venue: item.venue
      ? { id: item.venue.id, name: item.venue.name, city: item.venue.city, capacity: item.venue.capacity }
      : null,
    event: item.event
      ? { id: item.event.id, name: item.event.name, slug: item.event.slug, eventDate: item.event.eventDate.toISOString() }
      : null,
  }));

  const initialViews = views.map((v) => ({
    id: v.id,
    name: v.name,
    filters: v.filters as Record<string, unknown>,
    notifyEnabled: v.notifyEnabled,
    createdAt: v.createdAt.toISOString(),
  }));

  return <WatchlistClient initialItems={initialItems} initialViews={initialViews} />;
}
