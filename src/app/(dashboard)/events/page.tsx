import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Music,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Trophy,
} from "lucide-react";
import {
  getEventsWithScores,
  getEventFilterOptions,
  getEventCount,
} from "@/db/queries/events";
import { format } from "date-fns";
import Link from "next/link";
import { EventFilters } from "./filters";

const PAGE_SIZE = 24;

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    announced: "bg-blue-50 text-blue-700 border-blue-200",
    onsale: "bg-emerald-50 text-emerald-700 border-emerald-200",
    offsale: "bg-muted text-muted-foreground",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    postponed: "bg-amber-50 text-amber-700 border-amber-200",
    rescheduled: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <Badge className={colors[status] ?? "bg-muted text-muted-foreground"}>
      {status}
    </Badge>
  );
}

function formatPrice(min: string | null, max: string | null, currency: string | null) {
  if (!min && !max) return null;
  const fmt = (v: string) => `$${parseFloat(v).toFixed(0)}`;
  if (min && max && min !== max) return `${fmt(min)} - ${fmt(max)} ${currency ?? "CAD"}`;
  return `${fmt(min ?? max!)} ${currency ?? "CAD"}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventRow = any;

type GroupedItem =
  | { type: "single"; event: EventRow }
  | { type: "music-group"; key: string; events: EventRow[] }
  | { type: "sports-group"; key: string; events: EventRow[]; venueName: string };

function extractTeamName(eventName: string): string {
  // "Toronto Raptors vs Orlando Magic" → "Toronto Raptors"
  // "Toronto Maple Leafs v Carolina Hurricanes" → "Toronto Maple Leafs"
  const vsMatch = eventName.match(/^(.+?)\s+v(?:s\.?|\.)\s+/i);
  if (vsMatch) return vsMatch[1].trim();
  // "ST. PATS GAME | Toronto Maple Leafs v ..." → "Toronto Maple Leafs"
  const pipeMatch = eventName.match(/\|\s*(.+?)\s+v(?:s\.?|\.)\s+/i);
  if (pipeMatch) return pipeMatch[1].trim();
  return eventName;
}

function groupEvents(events: EventRow[]): GroupedItem[] {
  const groups = new Map<string, EventRow[]>();
  const order: string[] = [];

  for (const evt of events) {
    const primaryArtist = evt.artists?.find((a: { isPrimary: boolean | null }) => a.isPrimary);
    const isSports = evt.segment === "Sports";

    let key: string;
    if (isSports) {
      // Sports: group by team (primary artist or extracted team name)
      const teamKey = primaryArtist
        ? primaryArtist.artist.slug
        : extractTeamName(evt.name).toLowerCase().replace(/\s+/g, "-");
      key = `sports-${teamKey}`;
    } else if (primaryArtist) {
      // Music: group by primary artist + venue
      key = `music-${primaryArtist.artist.slug}-${evt.venueId ?? "none"}`;
    } else {
      key = `single-${evt.id}`;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(evt);
  }

  return order.map((key) => {
    const evts = groups.get(key)!;
    if (evts.length === 1 && !key.startsWith("sports-")) {
      return { type: "single" as const, event: evts[0] };
    }
    if (key.startsWith("sports-")) {
      return {
        type: "sports-group" as const,
        key,
        events: evts,
        venueName: evts[0].venue?.name ?? "Unknown Venue",
      };
    }
    return { type: "music-group" as const, key, events: evts };
  });
}

function SingleEventCard({ event }: { event: EventRow }) {
  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="h-full transition-colors hover:bg-muted/30">
        {event.imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
            <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover" />
            <div className="absolute top-2 right-2">{statusBadge(event.status)}</div>
          </div>
        )}
        <CardContent className={event.imageUrl ? "pt-3" : "pt-5"}>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-semibold leading-tight">{event.name}</h3>
              {!event.imageUrl && statusBadge(event.status)}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {event.eventDate && (
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {format(event.eventDate, "EEE, MMM d, yyyy")}
                </p>
              )}
              {event.venue && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {event.venue.name}
                </p>
              )}
              {event.artists?.length > 0 && (
                <p className="flex items-center gap-1.5">
                  <Music className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {event.artists.slice(0, 3).map((ea: { artist: { name: string } }) => ea.artist.name).join(", ")}
                    {event.artists.length > 3 && ` +${event.artists.length - 3} more`}
                  </span>
                </p>
              )}
              {(event.priceMin || event.priceMax) && (
                <p className="flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 shrink-0" />
                  {formatPrice(event.priceMin, event.priceMax, event.currency)}
                </p>
              )}
            </div>
            {event.genre && (
              <Badge variant="outline" className="text-xs">{event.genre}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MusicGroupCard({ events }: { events: EventRow[] }) {
  const first = events[0];
  return (
    <Link href={`/events/${first.slug}`}>
      <Card className="h-full transition-colors hover:bg-muted/30">
        {first.imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
            <img src={first.imageUrl} alt={first.name} className="h-full w-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-1">
              <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                <CalendarDays className="mr-1 h-3 w-3" />
                {events.length} dates
              </Badge>
            </div>
          </div>
        )}
        <CardContent className={first.imageUrl ? "pt-3" : "pt-5"}>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-semibold leading-tight">{first.name}</h3>
              {!first.imageUrl && (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 shrink-0">
                  {events.length} dates
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {events.map((evt) => (
                <span
                  key={evt.id}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {format(evt.eventDate, "MMM d")}
                </span>
              ))}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {first.venue && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {first.venue.name}
                </p>
              )}
              {first.artists?.length > 0 && (
                <p className="flex items-center gap-1.5">
                  <Music className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {first.artists.slice(0, 3).map((ea: { artist: { name: string } }) => ea.artist.name).join(", ")}
                  </span>
                </p>
              )}
            </div>
            {first.genre && (
              <Badge variant="outline" className="text-xs">{first.genre}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function extractOpponent(eventName: string): string | null {
  const match = eventName.match(/vs\.?\s+(.+?)(?:\s*\(|$)/i);
  return match?.[1]?.trim() ?? null;
}

function SportsGroupCard({ events, venueName }: { events: EventRow[]; venueName: string }) {
  const first = events[0];
  const primaryArtist = first.artists?.find((a: { isPrimary: boolean | null }) => a.isPrimary);
  const teamName = primaryArtist?.artist?.name ?? extractTeamName(first.name);

  return (
    <Link href={`/events/${first.slug}`}>
      <Card className="h-full transition-colors hover:bg-muted/30">
        {first.imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
            <img src={first.imageUrl} alt={teamName} className="h-full w-full object-cover" />
            <div className="absolute top-2 right-2">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                <Trophy className="mr-1 h-3 w-3" />
                {events.length} games
              </Badge>
            </div>
          </div>
        )}
        <CardContent className={first.imageUrl ? "pt-3" : "pt-5"}>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight">{teamName}</h3>
              {!first.imageUrl && (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                  {events.length} games
                </Badge>
              )}
            </div>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {venueName}
              </p>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-0.5">
              {events.slice(0, 8).map((evt) => {
                const opponent = extractOpponent(evt.name);
                return (
                  <div key={evt.id} className="flex items-center justify-between text-[11px]">
                    <span className="truncate text-muted-foreground">
                      {opponent ? `vs ${opponent}` : evt.name}
                    </span>
                    <span className="shrink-0 ml-2 text-muted-foreground/70">
                      {format(evt.eventDate, "MMM d")}
                    </span>
                  </div>
                );
              })}
              {events.length > 8 && (
                <p className="text-[10px] text-muted-foreground/50">
                  +{events.length - 8} more games
                </p>
              )}
            </div>
            {first.genre && (
              <Badge variant="outline" className="text-xs">{first.genre}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  // Multi-value filters: comma-separated strings → arrays
  const venueIds = typeof params.venue === "string"
    ? params.venue.split(",").map(Number).filter(Boolean)
    : undefined;
  const statusList = typeof params.status === "string"
    ? params.status.split(",").filter(Boolean)
    : undefined;
  const genreList = typeof params.genre === "string"
    ? params.genre.split(",").filter(Boolean)
    : undefined;
  const segmentParam = typeof params.segment === "string" ? params.segment : undefined;
  const segment = segmentParam ? (segmentParam === "all" ? undefined : segmentParam) : undefined; // Default to All Types
  const city = typeof params.city === "string" ? params.city : undefined;
  const minBuyScore = typeof params.minScore === "string" ? parseInt(params.minScore) : undefined;
  const sort = (typeof params.sort === "string" ? params.sort : "date_asc") as
    | "date_asc"
    | "date_desc"
    | "newest"
    | "name";
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page)) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const filterOpts = { venueIds, statuses: statusList, genres: genreList, segment, search, minBuyScore, city };

  const [evts, filterOptions, totalCount] = await Promise.all([
    getEventsWithScores({ ...filterOpts, sort, limit: PAGE_SIZE, offset }),
    getEventFilterOptions(),
    getEventCount(filterOpts),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (venueIds?.length) sp.set("venue", venueIds.join(","));
    if (statusList?.length) sp.set("status", statusList.join(","));
    if (genreList?.length) sp.set("genre", genreList.join(","));
    if (segmentParam === "all") sp.set("segment", "all");
    else if (segment) sp.set("segment", segment);
    if (city) sp.set("city", city);
    if (minBuyScore) sp.set("minScore", String(minBuyScore));
    if (sort !== "date_asc") sp.set("sort", sort);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/events${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-muted-foreground">
          {totalCount} upcoming events across North America
        </p>
      </div>

      <EventFilters
        venues={filterOptions.venues}
        genres={filterOptions.genres}
        segments={filterOptions.segments}
        statuses={filterOptions.statuses}
        cities={filterOptions.cities}
        currentVenues={venueIds}
        currentStatuses={statusList}
        currentGenres={genreList}
        currentSegment={segmentParam ?? "all"}
        currentCity={city}
        currentSort={sort}
        currentSearch={search}
        currentMinScore={minBuyScore}
      />

      {evts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No events match your filters. Try adjusting your search.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groupEvents(evts).map((item) =>
            item.type === "single" ? (
              <SingleEventCard key={item.event.id} event={item.event} />
            ) : item.type === "music-group" ? (
              <MusicGroupCard key={item.key} events={item.events} />
            ) : (
              <SportsGroupCard key={item.key} events={item.events} venueName={item.venueName} />
            )
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, totalCount)} of{" "}
            {totalCount}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={pageUrl(page - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={pageUrl(page + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border opacity-30">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
