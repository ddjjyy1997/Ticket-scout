import { NextResponse } from "next/server";
import { db } from "@/db";
import { resaleListingsSummary, scanLogs, notifications, events, presaleCodes, onsaleWindows } from "@/db/schema";
import { lt, and, eq, sql, inArray } from "drizzle-orm";
import { RETENTION_DAYS } from "@/lib/constants";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret") ??
    new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    resaleSnapshotsDeleted: 0,
    scanLogsDeleted: 0,
    notificationsDeleted: 0,
    eventsPastMarked: 0,
  };

  // Delete old resale snapshots
  const resaleCutoff = new Date();
  resaleCutoff.setDate(resaleCutoff.getDate() - RETENTION_DAYS.resaleSnapshots);
  const resaleResult = await db
    .delete(resaleListingsSummary)
    .where(lt(resaleListingsSummary.snapshotDate, resaleCutoff));

  // Delete old scan logs
  const logCutoff = new Date();
  logCutoff.setDate(logCutoff.getDate() - RETENTION_DAYS.scanLogs);
  await db.delete(scanLogs).where(lt(scanLogs.createdAt, logCutoff));

  // Delete old read notifications
  const notifCutoff = new Date();
  notifCutoff.setDate(notifCutoff.getDate() - RETENTION_DAYS.readNotifications);
  await db
    .delete(notifications)
    .where(
      and(eq(notifications.isRead, true), lt(notifications.createdAt, notifCutoff))
    );

  // Mark past events
  await db
    .update(events)
    .set({ status: "past" })
    .where(
      and(
        lt(events.eventDate, new Date()),
        sql`${events.status} NOT IN ('past', 'cancelled')`
      )
    );

  // Expire presale codes whose onsale window has ended
  const now = new Date();

  // Codes linked to a specific onsale window that has passed
  const expiredWindowCodes = await db
    .select({ codeId: presaleCodes.id })
    .from(presaleCodes)
    .innerJoin(onsaleWindows, eq(presaleCodes.onsaleWindowId, onsaleWindows.id))
    .where(
      and(
        eq(presaleCodes.status, "pending"),
        lt(sql`COALESCE(${onsaleWindows.endDate}, ${onsaleWindows.startDate} + INTERVAL '1 day')`, now)
      )
    );

  if (expiredWindowCodes.length > 0) {
    await db
      .update(presaleCodes)
      .set({ status: "expired" })
      .where(
        inArray(
          presaleCodes.id,
          expiredWindowCodes.map((r) => r.codeId)
        )
      );
  }

  // Codes for past events
  await db
    .update(presaleCodes)
    .set({ status: "expired" })
    .where(
      and(
        sql`${presaleCodes.status} IN ('pending', 'verified')`,
        sql`${presaleCodes.eventId} IN (SELECT id FROM events WHERE status = 'past' OR event_date < NOW())`
      )
    );

  return NextResponse.json({ message: "Cleanup complete", results });
}
