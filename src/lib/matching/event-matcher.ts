import { jaroWinkler, normalizeForMatch } from "./similarity";
import { searchEvents } from "@/services/seatgeek/client";
import type { SGEvent } from "@/services/seatgeek/types";
import { MATCH_CONFIDENCE_THRESHOLD } from "@/lib/constants";

// Hardcoded Toronto venue slug mappings (TM name -> SG venue slug)
const VENUE_SLUG_MAP: Record<string, string> = {
  "scotiabank-arena": "scotiabank-arena",
  "rogers-centre": "rogers-centre",
  "budweiser-stage": "budweiser-stage",
  "massey-hall": "massey-hall",
  "history-toronto": "history",
  "echo-beach": "echo-beach",
  "danforth-music-hall": "danforth-music-hall",
  "coca-cola-coliseum": "coca-cola-coliseum",
  "downsview-park": "downsview-park",
};

interface MatchResult {
  sgEvent: SGEvent;
  confidence: number;
  matchDetails: {
    artistScore: number;
    venueScore: number;
    dateScore: number;
    titleScore: number;
  };
}

interface EventToMatch {
  name: string;
  eventDate: Date;
  venueSlug?: string;
  venueName?: string;
  artistNames: string[];
}

export async function findSeatGeekMatch(
  event: EventToMatch
): Promise<MatchResult | null> {
  // Build search query from artist names or event title
  const searchQuery =
    event.artistNames.length > 0
      ? event.artistNames[0]
      : event.name;

  // Search SeatGeek with date window (+/- 2 hours)
  const eventDate = new Date(event.eventDate);
  const dateStart = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);
  const dateEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);

  const results = await searchEvents({
    q: searchQuery,
    "venue.city": "Toronto",
    "datetime_utc.gte": dateStart.toISOString().slice(0, 19),
    "datetime_utc.lte": dateEnd.toISOString().slice(0, 19),
    per_page: 10,
  });

  if (!results?.events?.length) return null;

  // Score each candidate
  let bestMatch: MatchResult | null = null;

  for (const sgEvent of results.events) {
    const artistScore = scoreArtistMatch(event.artistNames, sgEvent);
    const venueScore = scoreVenueMatch(event, sgEvent);
    const dateScore = scoreDateMatch(eventDate, sgEvent);
    const titleScore = scoreTitleMatch(event.name, sgEvent);

    // Weighted composite: artist 40%, venue 30%, date 20%, title 10%
    const confidence =
      artistScore * 0.4 +
      venueScore * 0.3 +
      dateScore * 0.2 +
      titleScore * 0.1;

    if (
      confidence >= MATCH_CONFIDENCE_THRESHOLD &&
      (!bestMatch || confidence > bestMatch.confidence)
    ) {
      bestMatch = {
        sgEvent,
        confidence,
        matchDetails: { artistScore, venueScore, dateScore, titleScore },
      };
    }
  }

  return bestMatch;
}

function scoreArtistMatch(artistNames: string[], sgEvent: SGEvent): number {
  if (artistNames.length === 0) return 0.5; // neutral if no artists

  const sgPerformers = sgEvent.performers.map((p) =>
    normalizeForMatch(p.name)
  );
  const normalizedArtists = artistNames.map(normalizeForMatch);

  let matchedCount = 0;
  for (const artist of normalizedArtists) {
    const bestSimilarity = Math.max(
      ...sgPerformers.map((p) => jaroWinkler(artist, p))
    );
    if (bestSimilarity >= 0.85) matchedCount++;
  }

  return normalizedArtists.length > 0
    ? matchedCount / normalizedArtists.length
    : 0;
}

function scoreVenueMatch(event: EventToMatch, sgEvent: SGEvent): number {
  // Try slug map first
  if (event.venueSlug && VENUE_SLUG_MAP[event.venueSlug]) {
    const sgSlug = normalizeForMatch(sgEvent.venue.slug);
    const expectedSlug = normalizeForMatch(VENUE_SLUG_MAP[event.venueSlug]);
    if (sgSlug === expectedSlug || sgSlug.includes(expectedSlug)) return 1.0;
  }

  // Fallback to name similarity
  if (event.venueName) {
    return jaroWinkler(
      normalizeForMatch(event.venueName),
      normalizeForMatch(sgEvent.venue.name)
    );
  }

  return 0.5; // neutral
}

function scoreDateMatch(eventDate: Date, sgEvent: SGEvent): number {
  const sgDate = new Date(sgEvent.datetime_utc + "Z");
  const diffHours =
    Math.abs(eventDate.getTime() - sgDate.getTime()) / (1000 * 60 * 60);

  if (diffHours < 1) return 1.0;
  if (diffHours < 2) return 0.9;
  if (diffHours < 6) return 0.7;
  if (diffHours < 24) return 0.4;
  return 0;
}

function scoreTitleMatch(eventName: string, sgEvent: SGEvent): number {
  const norm1 = normalizeForMatch(eventName);
  const norm2 = normalizeForMatch(sgEvent.title);
  return jaroWinkler(norm1, norm2);
}
