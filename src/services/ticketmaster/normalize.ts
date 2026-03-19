import type { TMEvent, TMImage } from "./types";
import { detectPresaleType, resolveSignupUrl } from "@/lib/presale-signup";

export interface NormalizedEvent {
  name: string;
  slug: string;
  eventDate: Date;
  eventEndDate: Date | null;
  genre: string | null;
  subGenre: string | null;
  segment: string | null;
  imageUrl: string | null;
  status: string;
  priceMin: string | null;
  priceMax: string | null;
  currency: string;
  sourceEventId: string;
  sourceUrl: string | null;
  artists: NormalizedArtist[];
  onsaleWindows: NormalizedOnsaleWindow[];
  tmVenueId: string | null;
}

export interface NormalizedArtist {
  name: string;
  normalizedName: string;
  slug: string;
  tmAttractionId: string;
  genre: string | null;
  imageUrl: string | null;
}

export interface NormalizedOnsaleWindow {
  windowType: string;
  windowName: string | null;
  startDate: Date;
  endDate: Date | null;
  signupUrl: string | null;
}

// Infer segment/genre from event name when TM classification is missing
const SPORTS_PATTERNS: { pattern: RegExp; genre: string }[] = [
  { pattern: /raptors|nba|basketball/i, genre: "Basketball" },
  { pattern: /maple leafs|marlies|nhl|hockey/i, genre: "Hockey" },
  { pattern: /blue jays|mlb|baseball/i, genre: "Baseball" },
  { pattern: /argonauts|cfl|football/i, genre: "Football" },
  { pattern: /toronto fc|tfc|mls|soccer/i, genre: "Soccer" },
  { pattern: /\bvs\.?\s/i, genre: "Sports" }, // generic "vs" pattern
];

function inferSegment(name: string): string {
  for (const { pattern } of SPORTS_PATTERNS) {
    if (pattern.test(name)) return "Sports";
  }
  // Default to Music — if it's at a concert venue and not sports, it's music
  return "Music";
}

function inferGenre(name: string): string | null {
  for (const { pattern, genre } of SPORTS_PATTERNS) {
    if (pattern.test(name)) return genre;
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestImage(images?: TMImage[]): string | null {
  if (!images?.length) return null;
  // Prefer 16:9 ratio, largest width
  const preferred = images
    .filter((img) => img.ratio === "16_9")
    .sort((a, b) => b.width - a.width);
  if (preferred.length > 0) return preferred[0].url;
  return images.sort((a, b) => b.width - a.width)[0].url;
}

function mapStatus(tmStatus: string): string {
  const statusMap: Record<string, string> = {
    onsale: "onsale",
    offsale: "offsale",
    cancelled: "cancelled",
    postponed: "postponed",
    rescheduled: "rescheduled",
  };
  return statusMap[tmStatus] ?? "announced";
}

export function normalizeEvent(tmEvent: TMEvent): NormalizedEvent | null {
  const dateTime = tmEvent.dates.start.dateTime;
  if (!dateTime) return null;

  const eventDate = new Date(dateTime);
  if (isNaN(eventDate.getTime())) return null;

  const artists: NormalizedArtist[] = (
    tmEvent._embedded?.attractions ?? []
  ).map((attraction) => ({
    name: attraction.name,
    normalizedName: normalizeName(attraction.name),
    slug: slugify(attraction.name),
    tmAttractionId: attraction.id,
    genre: attraction.classifications?.[0]?.genre?.name ?? null,
    imageUrl: pickBestImage(attraction.images),
  }));

  const primaryArtist = artists[0];
  const dateStr = eventDate.toISOString().split("T")[0];
  const venueSlug = tmEvent._embedded?.venues?.[0]?.name
    ? slugify(tmEvent._embedded.venues[0].name)
    : "toronto";

  const slug = primaryArtist
    ? `${slugify(primaryArtist.name)}-${venueSlug}-${dateStr}`
    : `${slugify(tmEvent.name)}-${venueSlug}-${dateStr}`;

  const onsaleWindows: NormalizedOnsaleWindow[] = [];

  // Public onsale
  if (tmEvent.sales?.public?.startDateTime) {
    onsaleWindows.push({
      windowType: "general",
      windowName: "Public Onsale",
      startDate: new Date(tmEvent.sales.public.startDateTime),
      endDate: tmEvent.sales.public.endDateTime
        ? new Date(tmEvent.sales.public.endDateTime)
        : null,
      signupUrl: null,
    });
  }

  // Presales
  if (tmEvent.sales?.presales) {
    for (const presale of tmEvent.sales.presales) {
      if (presale.startDateTime) {
        const presaleName = presale.name ?? null;
        onsaleWindows.push({
          windowType: detectPresaleType(presaleName),
          windowName: presaleName,
          startDate: new Date(presale.startDateTime),
          endDate: presale.endDateTime
            ? new Date(presale.endDateTime)
            : null,
          signupUrl: resolveSignupUrl(presaleName, primaryArtist?.name),
        });
      }
    }
  }

  return {
    name: tmEvent.name,
    slug,
    eventDate,
    eventEndDate: tmEvent.dates.end?.dateTime
      ? new Date(tmEvent.dates.end.dateTime)
      : null,
    genre: tmEvent.classifications?.[0]?.genre?.name ?? inferGenre(tmEvent.name),
    subGenre: tmEvent.classifications?.[0]?.subGenre?.name ?? null,
    segment: tmEvent.classifications?.[0]?.segment?.name ?? inferSegment(tmEvent.name),
    imageUrl: pickBestImage(tmEvent.images),
    status: mapStatus(tmEvent.dates.status.code),
    priceMin: tmEvent.priceRanges?.[0]?.min?.toString() ?? null,
    priceMax: tmEvent.priceRanges?.[0]?.max?.toString() ?? null,
    currency: tmEvent.priceRanges?.[0]?.currency ?? "CAD",
    sourceEventId: tmEvent.id,
    sourceUrl: tmEvent.url ?? null,
    artists,
    onsaleWindows,
    tmVenueId: tmEvent._embedded?.venues?.[0]?.id ?? null,
  };
}
