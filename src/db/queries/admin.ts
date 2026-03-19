import { db } from "@/db";
import { scanRuns, scanLogs, apiUsageLogs, events, artists, venues, presaleCodes, presaleCodeVotes } from "@/db/schema";
import { desc, count, eq, sql, gte } from "drizzle-orm";

export async function getRecentScanRuns(limit = 20) {
  return db
    .select()
    .from(scanRuns)
    .orderBy(desc(scanRuns.startedAt))
    .limit(limit);
}

export async function getAdminStats() {
  const [eventCount] = await db.select({ count: count() }).from(events);
  const [artistCount] = await db.select({ count: count() }).from(artists);
  const [venueCount] = await db.select({ count: count() }).from(venues);
  const [scanCount] = await db.select({ count: count() }).from(scanRuns);

  const today = new Date().toISOString().slice(0, 10);
  const [todayApiCalls] = await db
    .select({ count: count() })
    .from(apiUsageLogs)
    .where(eq(apiUsageLogs.callDate, today));

  const [lastScan] = await db
    .select()
    .from(scanRuns)
    .orderBy(desc(scanRuns.startedAt))
    .limit(1);

  // Presale code stats
  const [totalCodes] = await db.select({ count: count() }).from(presaleCodes);
  const [verifiedCodes] = await db
    .select({ count: count() })
    .from(presaleCodes)
    .where(eq(presaleCodes.status, "verified"));
  const [votedCodes] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${presaleCodeVotes.codeId})` })
    .from(presaleCodeVotes);
  const [autoScannedCodes] = await db
    .select({ count: count() })
    .from(presaleCodes)
    .where(eq(presaleCodes.source, "scraped"));

  return {
    events: eventCount.count,
    artists: artistCount.count,
    venues: venueCount.count,
    scans: scanCount.count,
    todayApiCalls: todayApiCalls.count,
    lastScan: lastScan ?? null,
    presaleCodes: {
      total: totalCodes.count,
      verified: verifiedCodes.count,
      voted: Number(votedCodes.count),
      autoScanned: autoScannedCodes.count,
    },
  };
}

export async function getApiUsageByDay(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  return db
    .select({
      date: apiUsageLogs.callDate,
      source: apiUsageLogs.source,
      count: count(),
    })
    .from(apiUsageLogs)
    .where(gte(apiUsageLogs.callDate, sinceStr))
    .groupBy(apiUsageLogs.callDate, apiUsageLogs.source)
    .orderBy(desc(apiUsageLogs.callDate));
}
