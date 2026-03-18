import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  onsaleWindows,
  events,
  venues,
  watchlists,
  watchlistItems,
  eventArtists,
  notifications,
  users,
  presaleCodes,
} from "@/db/schema";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";
import { addMinutes } from "date-fns";
import { sendPresaleReminderEmail } from "@/lib/email/presale-reminder";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = addMinutes(now, 15);
  const windowEnd = addMinutes(now, 35);

  // 1. Find onsale windows starting in 15-35 minutes
  const upcomingWindows = await db
    .select({
      windowId: onsaleWindows.id,
      windowType: onsaleWindows.windowType,
      windowName: onsaleWindows.windowName,
      startDate: onsaleWindows.startDate,
      signupUrl: onsaleWindows.signupUrl,
      accessCode: onsaleWindows.accessCode,
      eventId: events.id,
      eventName: events.name,
      eventSlug: events.slug,
      eventDate: events.eventDate,
      venueName: venues.name,
    })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(
      and(
        gte(onsaleWindows.startDate, windowStart),
        lte(onsaleWindows.startDate, windowEnd)
      )
    );

  if (upcomingWindows.length === 0) {
    return NextResponse.json({ sent: 0, windows: 0 });
  }

  // 2. For each window, find users to notify
  let totalSent = 0;

  for (const w of upcomingWindows) {
    // Find users watching this event directly
    const eventWatchers = await db
      .select({
        userId: watchlists.userId,
        email: users.email,
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlistItems.watchlistId, watchlists.id))
      .innerJoin(users, eq(watchlists.userId, users.id))
      .where(
        and(
          eq(watchlistItems.itemType, "event"),
          eq(watchlistItems.eventId, w.eventId)
        )
      );

    // Find users watching artists on this event
    const eventArtistIds = await db
      .select({ artistId: eventArtists.artistId })
      .from(eventArtists)
      .where(eq(eventArtists.eventId, w.eventId));

    let artistWatchers: { userId: string; email: string }[] = [];
    if (eventArtistIds.length > 0) {
      artistWatchers = await db
        .select({
          userId: watchlists.userId,
          email: users.email,
        })
        .from(watchlistItems)
        .innerJoin(watchlists, eq(watchlistItems.watchlistId, watchlists.id))
        .innerJoin(users, eq(watchlists.userId, users.id))
        .where(
          and(
            eq(watchlistItems.itemType, "artist"),
            inArray(
              watchlistItems.artistId,
              eventArtistIds.map((a) => a.artistId)
            )
          )
        );
    }

    // Deduplicate users
    const userMap = new Map<string, string>();
    for (const u of [...eventWatchers, ...artistWatchers]) {
      if (!userMap.has(u.userId)) {
        userMap.set(u.userId, u.email);
      }
    }

    if (userMap.size === 0) continue;

    // Check for existing presale codes on this event
    let accessCode: string | null = w.accessCode;
    if (!accessCode) {
      const [topCode] = await db
        .select({ code: presaleCodes.code })
        .from(presaleCodes)
        .where(
          and(
            eq(presaleCodes.eventId, w.eventId),
            gte(presaleCodes.confidence, sql`70`)
          )
        )
        .orderBy(sql`${presaleCodes.confidence} DESC`)
        .limit(1);
      accessCode = topCode?.code ?? null;
    }

    // Send to each user (check dedup first)
    for (const [userId, email] of userMap) {
      // Check if already sent for this window
      const [existing] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.type, "onsale_reminder"),
            eq(notifications.onsaleWindowId, w.windowId)
          )
        )
        .limit(1);

      if (existing) continue;

      // Create in-app notification
      await db.insert(notifications).values({
        userId,
        eventId: w.eventId,
        type: "onsale_reminder",
        onsaleWindowId: w.windowId,
        title: `${w.windowName ?? "Presale"} starting soon`,
        message: `${w.eventName} — ${w.windowName ?? w.windowType} starts in ~30 minutes${accessCode ? `. Code: ${accessCode}` : ""}`,
        channel: "email",
        sentAt: now,
      });

      // Send email
      try {
        await sendPresaleReminderEmail(email, {
          eventName: w.eventName,
          eventSlug: w.eventSlug,
          eventDate: w.eventDate,
          venueName: w.venueName,
          windowName: w.windowName,
          windowType: w.windowType,
          startDate: w.startDate,
          signupUrl: w.signupUrl,
          accessCode,
        });
      } catch (err) {
        console.error(`Failed to send presale reminder to ${email}:`, err);
      }

      totalSent++;
    }
  }

  return NextResponse.json({
    sent: totalSent,
    windows: upcomingWindows.length,
  });
}
