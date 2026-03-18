import { db } from "@/db";
import { venues, scanRuns, scanLogs, eventSources } from "@/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import { searchEventsByVenue } from "./client";
import { normalizeEvent } from "./normalize";
import { upsertEventFromTM } from "@/db/queries/events";
import { SCAN_CONFIG, SCAN_FILTER } from "@/lib/constants";
import { checkWatchlistMatches } from "@/lib/notifications/watchlist-matcher";
import { checkSavedViewMatches } from "@/lib/notifications/view-matcher";
import { autoScoreEvent } from "@/lib/scoring/auto-score";

export interface ScanResult {
  scanRunId: number;
  eventsFound: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsSkipped: number;
  errorCount: number;
  durationMs: number;
}

export async function runEventScan(
  triggeredBy: string = "cron",
  options?: { fullSync?: boolean }
): Promise<ScanResult> {
  const startTime = Date.now();
  const fullSync = options?.fullSync ?? false;

  // Create scan run record
  const [scanRun] = await db
    .insert(scanRuns)
    .values({
      runType: fullSync ? "full_scan" : "quick_scan",
      status: "running",
      triggeredBy,
    })
    .returning({ id: scanRuns.id });

  let eventsFound = 0;
  let eventsCreated = 0;
  let eventsUpdated = 0;
  let eventsSkipped = 0;
  let errorCount = 0;
  const newEventIds: number[] = [];

  try {
    // Preload known TM event IDs to skip already-loaded events
    const knownSources = await db
      .select({ sourceEventId: eventSources.sourceEventId })
      .from(eventSources)
      .where(eq(eventSources.source, "ticketmaster"));

    const knownTmIds = new Set(knownSources.map((s) => s.sourceEventId));
    await logScan(scanRun.id, "info", `${knownTmIds.size} events already in DB`);

    // Get all active venues with TM venue IDs
    const activeVenues = await db
      .select({ id: venues.id, name: venues.name, tmVenueId: venues.tmVenueId })
      .from(venues)
      .where(isNotNull(venues.tmVenueId));

    await logScan(scanRun.id, "info", `Starting ${fullSync ? "full" : "quick"} scan for ${activeVenues.length} venues`);

    for (const venue of activeVenues) {
      if (!venue.tmVenueId) continue;

      try {
        await logScan(scanRun.id, "info", `Scanning venue: ${venue.name}`);

        for (let page = 0; page < SCAN_CONFIG.maxPagesPerVenue; page++) {
          const response = await searchEventsByVenue(
            venue.tmVenueId,
            page,
            SCAN_CONFIG.eventsPerVenuePage
          );

          if (!response?._embedded?.events) {
            if (page === 0) {
              await logScan(
                scanRun.id,
                "info",
                `No events found for ${venue.name}`
              );
            }
            break;
          }

          const tmEvents = response._embedded.events;
          eventsFound += tmEvents.length;

          for (const tmEvent of tmEvents) {
            try {
              // Quick scan: skip events we already have
              if (!fullSync && knownTmIds.has(tmEvent.id)) {
                eventsSkipped++;
                continue;
              }

              const normalized = normalizeEvent(tmEvent);
              if (!normalized) continue;

              // Filter: skip non-music segments
              if (
                normalized.segment &&
                !SCAN_FILTER.allowedSegments.includes(normalized.segment as typeof SCAN_FILTER.allowedSegments[number])
              ) {
                eventsSkipped++;
                continue;
              }

              // Filter: skip blacklisted event names
              if (
                SCAN_FILTER.nameBlacklist.some((pattern) =>
                  pattern.test(normalized.name)
                )
              ) {
                eventsSkipped++;
                continue;
              }

              const result = await upsertEventFromTM(normalized);
              eventsCreated += result.created;
              eventsUpdated += result.updated;
              if (result.createdEventId) {
                newEventIds.push(result.createdEventId);
                knownTmIds.add(tmEvent.id); // Track so we don't process again
                // Auto-score immediately from TM data
                try {
                  await autoScoreEvent(result.createdEventId);
                } catch {}
              }
            } catch (err) {
              errorCount++;
              await logScan(
                scanRun.id,
                "error",
                `Failed to process event ${tmEvent.id}: ${err instanceof Error ? err.message : "Unknown error"}`
              );
            }
          }

          // Don't fetch next page if we got fewer results than page size
          if (tmEvents.length < SCAN_CONFIG.eventsPerVenuePage) break;
        }
      } catch (err) {
        errorCount++;
        await logScan(
          scanRun.id,
          "error",
          `Failed to scan venue ${venue.name}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    // Check watchlist matches for newly created events
    if (newEventIds.length > 0) {
      try {
        const notifCount = await checkWatchlistMatches(newEventIds);
        if (notifCount > 0) {
          await logScan(scanRun.id, "info", `Created ${notifCount} watchlist notifications`);
        }
      } catch (err) {
        await logScan(scanRun.id, "error", `Watchlist check failed: ${err instanceof Error ? err.message : "Unknown"}`);
      }

      try {
        const viewNotifCount = await checkSavedViewMatches(newEventIds);
        if (viewNotifCount > 0) {
          await logScan(scanRun.id, "info", `Created ${viewNotifCount} saved view notifications`);
        }
      } catch (err) {
        await logScan(scanRun.id, "error", `Saved view check failed: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    const durationMs = Date.now() - startTime;

    // Update scan run
    await db
      .update(scanRuns)
      .set({
        status: errorCount > 0 ? "partial" : "completed",
        eventsFound,
        eventsCreated,
        eventsUpdated,
        errorCount,
        durationMs,
        completedAt: new Date(),
      })
      .where(eq(scanRuns.id, scanRun.id));

    await logScan(
      scanRun.id,
      "info",
      `Scan complete. Found: ${eventsFound}, Skipped: ${eventsSkipped}, Created: ${eventsCreated}, Updated: ${eventsUpdated}, Errors: ${errorCount}, Duration: ${durationMs}ms`
    );

    return {
      scanRunId: scanRun.id,
      eventsFound,
      eventsCreated,
      eventsUpdated,
      eventsSkipped,
      errorCount,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    await db
      .update(scanRuns)
      .set({
        status: "failed",
        errorCount,
        durationMs,
        completedAt: new Date(),
      })
      .where(eq(scanRuns.id, scanRun.id));

    await logScan(
      scanRun.id,
      "error",
      `Scan failed: ${err instanceof Error ? err.message : "Unknown error"}`
    );

    return {
      scanRunId: scanRun.id,
      eventsFound,
      eventsCreated,
      eventsUpdated,
      eventsSkipped,
      errorCount: errorCount + 1,
      durationMs,
    };
  }
}

async function logScan(
  scanRunId: number,
  level: string,
  message: string
) {
  await db
    .insert(scanLogs)
    .values({ scanRunId, level, message })
    .catch(() => {});
}
