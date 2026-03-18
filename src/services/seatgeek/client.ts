import { SG_API_BASE } from "@/lib/constants";
import type { SGSearchResponse } from "./types";
import { db } from "@/db";
import { apiUsageLogs } from "@/db/schema";

const CLIENT_ID = process.env.SG_CLIENT_ID!;

async function sgFetch(
  endpoint: string,
  params: Record<string, string>
): Promise<Response> {
  const url = new URL(`${SG_API_BASE}${endpoint}`);
  url.searchParams.set("client_id", CLIENT_ID);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const startTime = Date.now();
  const response = await fetch(url.toString());
  const responseTimeMs = Date.now() - startTime;

  // Log API usage
  db.insert(apiUsageLogs)
    .values({
      source: "seatgeek",
      endpoint,
      method: "GET",
      statusCode: response.status,
      responseTimeMs,
    })
    .catch(() => {});

  return response;
}

export async function searchEvents(params: {
  q?: string;
  "performers.slug"?: string;
  "venue.city"?: string;
  "datetime_utc.gte"?: string;
  "datetime_utc.lte"?: string;
  per_page?: number;
  page?: number;
}): Promise<SGSearchResponse | null> {
  try {
    const queryParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) queryParams[k] = String(v);
    }
    if (!queryParams.per_page) queryParams.per_page = "10";

    const response = await sgFetch("/events", queryParams);
    if (!response.ok) {
      console.error(`SG API error: ${response.status}`);
      return null;
    }
    return (await response.json()) as SGSearchResponse;
  } catch (error) {
    console.error("SG API fetch error:", error);
    return null;
  }
}

export async function getEventById(sgEventId: number) {
  try {
    const response = await sgFetch(`/events/${sgEventId}`, {});
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
