import { db } from "@/db";
import {
  savedViews,
  notifications,
  events,
  eventScores,
  userPreferences,
  users,
  onsaleWindows,
} from "@/db/schema";
import type { SavedViewFilters } from "@/db/schema/saved-views";
import { eq, inArray } from "drizzle-orm";
import { sendNewEventEmail } from "@/lib/email/resend";

/**
 * Check newly created events against all saved views with notifications enabled.
 * Creates in-app notifications and sends emails for matches.
 */
export async function checkSavedViewMatches(
  newEventIds: number[]
): Promise<number> {
  if (newEventIds.length === 0) return 0;

  // Get all views with notifications enabled
  const notifiedViews = await db
    .select()
    .from(savedViews)
    .where(eq(savedViews.notifyEnabled, true));

  if (notifiedViews.length === 0) return 0;

  // Get the new events with related data
  const newEvents = await db.query.events.findMany({
    where: inArray(events.id, newEventIds),
    with: {
      venue: true,
      artists: { with: { artist: true } },
      onsaleWindows: true,
    },
  });

  // Get scores for new events
  const scores = await db
    .select({ eventId: eventScores.eventId, buyScore: eventScores.buyScore })
    .from(eventScores)
    .where(inArray(eventScores.eventId, newEventIds));
  const scoreMap = new Map(scores.map((s) => [s.eventId, Number(s.buyScore)]));

  let notificationCount = 0;

  // Group matches by user for email batching
  const userMatches: Map<
    string,
    { viewName: string; events: typeof newEvents }[]
  > = new Map();

  for (const view of notifiedViews) {
    const filters = view.filters as SavedViewFilters;
    const matched = newEvents.filter((event) =>
      matchesFilters(event, filters, scoreMap.get(event.id) ?? null)
    );

    if (matched.length === 0) continue;

    // Create in-app notifications with presale info
    for (const event of matched) {
      const presaleInfo = formatPresaleInfo(event.onsaleWindows);
      const venuePart = event.venue ? ` at ${event.venue.name}` : "";

      await db
        .insert(notifications)
        .values({
          userId: view.userId,
          eventId: event.id,
          type: "new_event",
          title: `New event: ${event.name}`,
          message: `${event.name}${venuePart} matches your "${view.name}" view.${presaleInfo}`,
          channel: "in_app",
        })
        .onConflictDoNothing();

      notificationCount++;
    }

    // Queue for email
    if (!userMatches.has(view.userId)) {
      userMatches.set(view.userId, []);
    }
    userMatches.get(view.userId)!.push({
      viewName: view.name,
      events: matched,
    });
  }

  // Send batched emails per user
  for (const [userId, matches] of userMatches) {
    try {
      // Check user preferences
      const [prefs] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      // No prefs row = use defaults (both true). Only skip if explicitly disabled.
      if (prefs && (!prefs.emailNotifications || !prefs.notifyNewEvents)) continue;

      // Get user email
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user?.email) continue;

      await sendNewEventEmail(user.email, matches);
    } catch (err) {
      console.error(`[view-matcher] Email send failed for user ${userId}:`, err);
    }
  }

  return notificationCount;
}

function matchesFilters(
  event: {
    venueId: number | null;
    genre: string | null;
    segment: string | null;
    status: string;
    name: string;
  },
  filters: SavedViewFilters,
  buyScore: number | null
): boolean {
  // Venue: comma-separated IDs (e.g. "1,3,11")
  if (filters.venue) {
    const venueIds = filters.venue.split(",").map(Number).filter(Boolean);
    if (venueIds.length > 0 && (event.venueId === null || !venueIds.includes(event.venueId))) {
      return false;
    }
  }

  // Genre: comma-separated
  if (filters.genre) {
    const genreList = filters.genre.split(",").filter(Boolean);
    if (genreList.length > 0 && (event.genre === null || !genreList.includes(event.genre))) {
      return false;
    }
  }

  // Segment
  if (filters.segment && filters.segment !== "all" && event.segment !== filters.segment) {
    return false;
  }

  // Status: comma-separated
  if (filters.status) {
    const statusList = filters.status.split(",").filter(Boolean);
    if (statusList.length > 0 && !statusList.includes(event.status)) {
      return false;
    }
  }

  // Search
  if (filters.search) {
    const search = filters.search.toLowerCase();
    if (!event.name.toLowerCase().includes(search)) return false;
  }

  // Score: events are auto-scored at scan time now
  if (filters.minScore && filters.minScore > 0) {
    if (buyScore === null || buyScore < filters.minScore) return false;
  }

  return true;
}

function formatPresaleInfo(
  windows: { windowType: string; startDate: Date; endDate: Date | null }[]
): string {
  if (!windows || windows.length === 0) return "";

  const now = new Date();
  const upcoming = windows
    .filter((w) => w.startDate > now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (upcoming.length === 0) {
    const past = windows.filter((w) => w.startDate <= now);
    if (past.length > 0) return " Already on sale.";
    return "";
  }

  const parts: string[] = [];
  const presales = upcoming.filter((w) => w.windowType === "presale");
  const general = upcoming.find((w) => w.windowType === "general");

  if (presales.length > 0) {
    const first = presales[0];
    parts.push(
      ` Presale: ${first.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
    );
  }

  if (general) {
    parts.push(
      ` General: ${general.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
    );
  }

  return parts.join(" |");
}
