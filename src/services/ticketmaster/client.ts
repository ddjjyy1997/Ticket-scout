import { TM_API_BASE } from "@/lib/constants";
import type { TMSearchResponse } from "./types";
import { db } from "@/db";
import { apiUsageLogs } from "@/db/schema";

const API_KEY = process.env.TM_API_KEY!;

// Simple in-memory rate limiter: max 2 requests per second
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 500; // 2 req/s

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_INTERVAL_MS - elapsed)
    );
  }
  lastRequestTime = Date.now();
}

async function tmFetch(
  endpoint: string,
  params: Record<string, string>
): Promise<Response> {
  await rateLimit();

  const url = new URL(`${TM_API_BASE}${endpoint}`);
  url.searchParams.set("apikey", API_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const startTime = Date.now();
  const response = await fetch(url.toString());
  const responseTimeMs = Date.now() - startTime;

  // Log API usage (fire and forget)
  db.insert(apiUsageLogs)
    .values({
      source: "ticketmaster",
      endpoint,
      method: "GET",
      statusCode: response.status,
      responseTimeMs,
    })
    .catch(() => {}); // don't block on logging failure

  if (response.status === 429) {
    // Rate limited — wait and retry once
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return fetch(url.toString());
  }

  return response;
}

export async function searchEventsByVenue(
  venueId: string,
  page = 0,
  size = 50
): Promise<TMSearchResponse | null> {
  try {
    const response = await tmFetch("/events.json", {
      venueId,
      size: String(size),
      page: String(page),
      sort: "date,asc",
      countryCode: "CA",
    });

    if (!response.ok) {
      console.error(
        `TM API error: ${response.status} for venue ${venueId}`
      );
      return null;
    }

    return (await response.json()) as TMSearchResponse;
  } catch (error) {
    console.error(`TM API fetch error for venue ${venueId}:`, error);
    return null;
  }
}

export async function searchVenueByKeyword(
  keyword: string
): Promise<TMSearchResponse | null> {
  try {
    const response = await tmFetch("/venues.json", {
      keyword,
      countryCode: "CA",
      size: "5",
    });

    if (!response.ok) return null;
    return (await response.json()) as TMSearchResponse;
  } catch {
    return null;
  }
}
