import { db } from "@/db";
import {
  watchlists,
  watchlistItems,
  notifications,
  eventArtists,
  events,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Check newly created events against all users' watchlists
 * and create notifications for matches.
 */
export async function checkWatchlistMatches(newEventIds: number[]): Promise<number> {
  if (newEventIds.length === 0) return 0;

  let notificationCount = 0;

  // Get all watchlist items (artist + venue type)
  const allWatchItems = await db
    .select({
      watchlistId: watchlistItems.watchlistId,
      itemType: watchlistItems.itemType,
      artistId: watchlistItems.artistId,
      venueId: watchlistItems.venueId,
      userId: watchlists.userId,
    })
    .from(watchlistItems)
    .innerJoin(watchlists, eq(watchlistItems.watchlistId, watchlists.id));

  if (allWatchItems.length === 0) return 0;

  // Get the new events with their artists and venue info
  const newEvents = await db.query.events.findMany({
    where: inArray(events.id, newEventIds),
    with: {
      venue: true,
      artists: {
        with: { artist: true },
      },
    },
  });

  // Check each event against watchlist items
  for (const event of newEvents) {
    // Check artist matches
    const eventArtistIds = event.artists?.map((ea) => ea.artistId) ?? [];
    const artistWatchers = allWatchItems.filter(
      (w) => w.itemType === "artist" && w.artistId && eventArtistIds.includes(w.artistId)
    );

    for (const watcher of artistWatchers) {
      const matchedArtist = event.artists?.find((ea) => ea.artistId === watcher.artistId);
      const artistName = matchedArtist?.artist?.name ?? "Unknown artist";

      await db
        .insert(notifications)
        .values({
          userId: watcher.userId,
          eventId: event.id,
          type: "watchlist_match",
          title: `New event: ${artistName}`,
          message: `${event.name} — ${artistName} has a new event${event.venue ? ` at ${event.venue.name}` : ""}.`,
          channel: "in_app",
        })
        .onConflictDoNothing();

      notificationCount++;
    }

    // Check venue matches
    if (event.venueId) {
      const venueWatchers = allWatchItems.filter(
        (w) => w.itemType === "venue" && w.venueId === event.venueId
      );

      for (const watcher of venueWatchers) {
        // Don't duplicate if same user already got artist notification for this event
        const alreadyNotified = artistWatchers.some((aw) => aw.userId === watcher.userId);
        if (alreadyNotified) continue;

        await db
          .insert(notifications)
          .values({
            userId: watcher.userId,
            eventId: event.id,
            type: "watchlist_match",
            title: `New event at ${event.venue?.name ?? "watched venue"}`,
            message: `${event.name} — A new event has been added at ${event.venue?.name ?? "a watched venue"}.`,
            channel: "in_app",
          })
          .onConflictDoNothing();

        notificationCount++;
      }
    }
  }

  return notificationCount;
}
