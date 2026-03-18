/**
 * Presale Code Scanner
 *
 * Orchestrates searching multiple sources (Reddit, Google) for presale codes.
 * Two modes:
 *  - "morning": Runs at 5:30 AM, scans today+tomorrow's artist/LN presales
 *  - "jit": Runs every 10 min, scans presales starting in the next 10-20 min
 *
 * Only scans artist presales and Live Nation presales (the ones that use codes).
 * Skips events that already have a verified/upvoted working code.
 */

import { db } from "@/db";
import {
  onsaleWindows,
  events,
  eventArtists,
  artists,
  presaleCodes,
} from "@/db/schema";
import { eq, and, gte, lte, asc, inArray, sql } from "drizzle-orm";
import { startOfDay, endOfDay, addDays, addMinutes } from "date-fns";
import { searchReddit } from "./sources/reddit";
import { searchGoogle } from "./sources/google";
import { searchWebScrape } from "./sources/web-scrape";

// Only scan these presale types — they're the ones that actually use codes
const CODE_PRESALE_TYPES = [
  "artist",
  "presale",   // includes Live Nation which maps to "presale" type
  "fan_club",
  "venue",
];

// Window names that indicate code-based presales
const CODE_WINDOW_PATTERNS = /artist|live\s*nation|live\s*insider|fan\s*club|venue\s*presale|insider|presale/i;

export type ScanMode = "morning" | "jit" | "force";

export interface ScanResult {
  mode: ScanMode;
  eventsScanned: number;
  eventsSkipped: number;
  codesFound: number;
  codesInserted: number;
  codesDuplicate: number;
  errors: string[];
  details: {
    eventName: string;
    artistName: string;
    codesFound: string[];
    skipped?: string;
  }[];
}

interface PresaleToScan {
  eventId: number;
  eventName: string;
  artistName: string;
  windowIds: number[];
}

/**
 * Get presales that need code scanning based on mode.
 * Only returns artist/LN presale windows (the ones that use codes).
 */
async function getPresalesToScan(mode: ScanMode): Promise<PresaleToScan[]> {
  const now = new Date();

  let scanStart: Date;
  let scanEnd: Date;

  if (mode === "force") {
    // Force: all upcoming presales (next 30 days)
    scanStart = now;
    scanEnd = endOfDay(addDays(now, 30));
  } else if (mode === "jit") {
    // JIT: presales starting in the next 8-18 minutes
    // Cron runs every 15 min — this catches presales ~10 min before they open
    scanStart = addMinutes(now, 3);
    scanEnd = addMinutes(now, 18);
  } else {
    // Morning: today + tomorrow
    scanStart = startOfDay(now);
    scanEnd = endOfDay(addDays(now, 1));
  }

  const windows = await db
    .select({
      windowId: onsaleWindows.id,
      windowType: onsaleWindows.windowType,
      windowName: onsaleWindows.windowName,
      startDate: onsaleWindows.startDate,
      eventId: events.id,
      eventName: events.name,
    })
    .from(onsaleWindows)
    .innerJoin(events, eq(onsaleWindows.eventId, events.id))
    .where(
      and(
        gte(onsaleWindows.startDate, scanStart),
        lte(onsaleWindows.startDate, scanEnd),
        sql`${onsaleWindows.windowType} != 'general'`
      )
    )
    .orderBy(asc(onsaleWindows.startDate));

  // Filter to only code-based presale types
  const codeWindows = windows.filter(
    (w) =>
      CODE_PRESALE_TYPES.includes(w.windowType) ||
      CODE_WINDOW_PATTERNS.test(w.windowName ?? "")
  );

  if (codeWindows.length === 0) return [];

  // Get primary artists for these events
  const eventIds = [...new Set(codeWindows.map((w) => w.eventId))];

  const artistRows = await db
    .select({
      eventId: eventArtists.eventId,
      name: artists.name,
      isPrimary: eventArtists.isPrimary,
    })
    .from(eventArtists)
    .innerJoin(artists, eq(eventArtists.artistId, artists.id))
    .where(inArray(eventArtists.eventId, eventIds));

  const artistMap = new Map<number, string>();
  for (const a of artistRows) {
    if (!artistMap.has(a.eventId) || a.isPrimary) {
      artistMap.set(a.eventId, a.name);
    }
  }

  // Group windows by event
  const eventMap = new Map<number, PresaleToScan>();

  for (const w of codeWindows) {
    const artistName = artistMap.get(w.eventId);
    if (!artistName) continue;

    if (!eventMap.has(w.eventId)) {
      eventMap.set(w.eventId, {
        eventId: w.eventId,
        eventName: w.eventName,
        artistName,
        windowIds: [],
      });
    }
    eventMap.get(w.eventId)!.windowIds.push(w.windowId);
  }

  return [...eventMap.values()];
}

/**
 * Check if an event already has a verified (upvoted working) code.
 * If so, no need to scan again.
 */
async function hasVerifiedCode(eventId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: presaleCodes.id })
    .from(presaleCodes)
    .where(
      and(
        eq(presaleCodes.eventId, eventId),
        sql`(${presaleCodes.status} = 'verified' OR CAST(${presaleCodes.confidence} AS integer) >= 50)`
      )
    )
    .limit(1);
  return !!row;
}

/**
 * Check if a code already exists for an event.
 */
async function codeExists(eventId: number, code: string): Promise<boolean> {
  const [row] = await db
    .select({ id: presaleCodes.id })
    .from(presaleCodes)
    .where(
      and(
        eq(presaleCodes.eventId, eventId),
        eq(presaleCodes.code, code.toUpperCase())
      )
    )
    .limit(1);
  return !!row;
}

/**
 * Insert a scraped presale code.
 */
async function insertScrapedCode(params: {
  eventId: number;
  onsaleWindowId: number;
  code: string;
  notes: string;
}): Promise<boolean> {
  try {
    await db.insert(presaleCodes).values({
      eventId: params.eventId,
      onsaleWindowId: params.onsaleWindowId,
      code: params.code.toUpperCase(),
      source: "scraped",
      submittedBy: null,
      status: "pending",
      confidence: "0",
      notes: params.notes,
    });
    return true;
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("presale_codes_event_code_unique")
    ) {
      return false;
    }
    throw err;
  }
}

/**
 * Run the presale code scanner.
 * @param mode - "morning" for daily scan, "jit" for just-in-time before presale starts
 */
export async function runCodeScan(
  mode: ScanMode = "morning"
): Promise<ScanResult> {
  const result: ScanResult = {
    mode,
    eventsScanned: 0,
    eventsSkipped: 0,
    codesFound: 0,
    codesInserted: 0,
    codesDuplicate: 0,
    errors: [],
    details: [],
  };

  const presales = await getPresalesToScan(mode);
  console.log(
    `[code-scanner:${mode}] Found ${presales.length} artist/LN presales to scan`
  );

  if (presales.length === 0) return result;

  for (const presale of presales) {
    // Skip if event already has a verified code
    const hasVerified = await hasVerifiedCode(presale.eventId);
    if (hasVerified) {
      result.eventsSkipped++;
      result.details.push({
        eventName: presale.eventName,
        artistName: presale.artistName,
        codesFound: [],
        skipped: "Already has verified code",
      });
      console.log(
        `[code-scanner:${mode}] Skipping ${presale.artistName} — already has verified code`
      );
      continue;
    }

    result.eventsScanned++;
    const detail = {
      eventName: presale.eventName,
      artistName: presale.artistName,
      codesFound: [] as string[],
    };

    try {
      console.log(
        `[code-scanner:${mode}] Scanning for: ${presale.artistName} (${presale.eventName})`
      );

      // Search all sources in parallel
      const [redditCodes, googleCodes, webCodes] = await Promise.allSettled([
        searchReddit(presale.artistName, presale.eventName),
        searchGoogle(presale.artistName),
        searchWebScrape(presale.artistName),
      ]);

      const allCodes = [
        ...(redditCodes.status === "fulfilled" ? redditCodes.value : []),
        ...(googleCodes.status === "fulfilled" ? googleCodes.value : []),
        ...(webCodes.status === "fulfilled" ? webCodes.value : []),
      ];

      if (redditCodes.status === "rejected") {
        result.errors.push(
          `Reddit failed for ${presale.artistName}: ${redditCodes.reason}`
        );
      }
      if (googleCodes.status === "rejected") {
        result.errors.push(
          `Google failed for ${presale.artistName}: ${googleCodes.reason}`
        );
      }
      if (webCodes.status === "rejected") {
        result.errors.push(
          `Web scrape failed for ${presale.artistName}: ${webCodes.reason}`
        );
      }

      // Deduplicate codes
      const uniqueCodes = new Map<string, (typeof allCodes)[0]>();
      for (const c of allCodes) {
        const existing = uniqueCodes.get(c.code);
        if (
          !existing ||
          (c.confidence === "high" && existing.confidence !== "high")
        ) {
          uniqueCodes.set(c.code, c);
        }
      }

      result.codesFound += uniqueCodes.size;

      for (const [code, info] of uniqueCodes) {
        detail.codesFound.push(code);

        const exists = await codeExists(presale.eventId, code);
        if (exists) {
          result.codesDuplicate++;
          continue;
        }

        const inserted = await insertScrapedCode({
          eventId: presale.eventId,
          onsaleWindowId: presale.windowIds[0],
          code,
          notes: `Auto-scanned (${mode}) from ${info.source}. Context: "${info.context.slice(0, 100)}"`,
        });

        if (inserted) {
          result.codesInserted++;
        } else {
          result.codesDuplicate++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${presale.artistName}: ${msg}`);
      console.error(
        `[code-scanner:${mode}] Error scanning ${presale.artistName}:`,
        err
      );
    }

    result.details.push(detail);

    // Delay between events — shorter for JIT since it's time-sensitive
    await new Promise((r) => setTimeout(r, mode === "jit" ? 1000 : 2000));
  }

  console.log(
    `[code-scanner:${mode}] Done. Scanned: ${result.eventsScanned}, Skipped: ${result.eventsSkipped}, Found: ${result.codesFound}, Inserted: ${result.codesInserted}`
  );

  return result;
}
