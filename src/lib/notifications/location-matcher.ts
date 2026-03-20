import { db } from "@/db";
import {
  userPreferences,
  notifications,
  events,
} from "@/db/schema";
import { inArray, isNotNull } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";

/**
 * Auto-notify users about new events with upcoming presales
 * in their preferred city. Runs after each scan batch.
 */
export async function checkLocationMatches(
  newEventIds: number[]
): Promise<number> {
  if (newEventIds.length === 0) return 0;

  // Get users who have a notify city set
  const usersWithCity = await db
    .select({
      userId: userPreferences.userId,
      notifyCity: userPreferences.notifyCity,
      pushNotifications: userPreferences.pushNotifications,
    })
    .from(userPreferences)
    .where(isNotNull(userPreferences.notifyCity));

  if (usersWithCity.length === 0) return 0;

  // Get new events with venue + presale info
  const newEvents = await db.query.events.findMany({
    where: inArray(events.id, newEventIds),
    with: {
      venue: true,
      onsaleWindows: true,
    },
  });

  let notificationCount = 0;

  // Build city -> users map (case-insensitive)
  const cityUsers = new Map<string, typeof usersWithCity>();
  for (const u of usersWithCity) {
    if (!u.notifyCity) continue;
    const key = u.notifyCity.toLowerCase();
    if (!cityUsers.has(key)) cityUsers.set(key, []);
    cityUsers.get(key)!.push(u);
  }

  for (const event of newEvents) {
    if (!event.venue?.city) continue;

    const venueCity = event.venue.city.toLowerCase();
    const matchedUsers = cityUsers.get(venueCity);
    if (!matchedUsers || matchedUsers.length === 0) continue;

    // Check if event has upcoming presales
    const now = new Date();
    const hasPresale = event.onsaleWindows?.some(
      (w) => w.windowType === "presale" && w.startDate > now
    );

    const title = hasPresale
      ? `Presale coming: ${event.name}`
      : `New event in ${event.venue.city}: ${event.name}`;

    const presaleWindow = event.onsaleWindows
      ?.filter((w) => w.windowType === "presale" && w.startDate > now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];

    const presaleDate = presaleWindow
      ? ` Presale starts ${presaleWindow.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.`
      : "";

    const message = `${event.name} at ${event.venue.name}.${presaleDate}`;

    for (const user of matchedUsers) {
      // Create in-app notification
      await db
        .insert(notifications)
        .values({
          userId: user.userId,
          eventId: event.id,
          type: "new_event",
          title,
          message,
          channel: "in_app",
        })
        .onConflictDoNothing();

      // Send push notification
      if (user.pushNotifications !== false) {
        try {
          await sendPushToUser(user.userId, {
            title,
            body: message,
            url: `/events/${(event as { slug?: string }).slug ?? event.id}`,
            tag: `location-${event.id}`,
          });
        } catch {}
      }

      notificationCount++;
    }
  }

  return notificationCount;
}
