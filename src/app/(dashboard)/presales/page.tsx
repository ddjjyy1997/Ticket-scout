import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  MapPin,
  Music,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Ticket,
} from "lucide-react";
import {
  getUpcomingPresales,
  getPresaleCount,
  getPresaleFilterOptions,
} from "@/db/queries/presales";
import type { PresaleWindow, GroupedPresaleRow } from "@/db/queries/presales";
import { getCodeCountsForEvents } from "@/db/queries/presale-codes";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import Link from "next/link";
import { PresaleFilters } from "./filters";
import { PRESALE_TYPE_COLORS } from "@/lib/presale-signup";

const PAGE_SIZE = 30;

function windowBadge(w: PresaleWindow) {
  const color =
    PRESALE_TYPE_COLORS[w.windowType] ?? "bg-muted text-muted-foreground";
  return (
    <Badge
      key={w.id}
      className={`text-[10px] ${color}`}
    >
      {w.windowName ?? w.windowType}
    </Badge>
  );
}

function urgencyLabel(date: Date) {
  if (isToday(date)) {
    return (
      <Badge className="bg-red-50 text-red-700 border-red-200 animate-pulse">
        TODAY
      </Badge>
    );
  }
  if (isTomorrow(date)) {
    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200">
        TOMORROW
      </Badge>
    );
  }
  return null;
}

function formatPrice(min: string | null, max: string | null, currency: string | null) {
  if (!min && !max) return null;
  const fmt = (v: string) => `$${parseFloat(v).toFixed(0)}`;
  if (min && max && min !== max) return `${fmt(min)} - ${fmt(max)} ${currency ?? "CAD"}`;
  return `${fmt(min ?? max!)} ${currency ?? "CAD"}`;
}

export default async function PresalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const venueIds = typeof params.venue === "string"
    ? params.venue.split(",").map(Number).filter(Boolean)
    : undefined;
  const genres = typeof params.genre === "string"
    ? params.genre.split(",").filter(Boolean)
    : undefined;
  const segment = typeof params.segment === "string" ? params.segment : undefined;
  const windowType = (typeof params.type === "string" ? params.type : "all") as
    | "all"
    | "presale"
    | "general";
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page)) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const filterOpts = { venueIds, genres, segment, search, windowType };

  const [presales, totalCount, filterOptions] = await Promise.all([
    getUpcomingPresales({ ...filterOpts, limit: PAGE_SIZE, offset }),
    getPresaleCount(filterOpts),
    getPresaleFilterOptions(),
  ]);

  // Fetch presale code counts for displayed events
  const eventIds = [...new Set(presales.map((r) => r.event.id))];
  const codeCounts = await getCodeCountsForEvents(eventIds);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (venueIds?.length) sp.set("venue", venueIds.join(","));
    if (genres?.length) sp.set("genre", genres.join(","));
    if (segment) sp.set("segment", segment);
    if (windowType !== "all") sp.set("type", windowType);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/presales${qs ? `?${qs}` : ""}`;
  }

  // Group multi-date events: same primary artist + same venue = one card
  type PresaleGroup = {
    key: string;
    rows: GroupedPresaleRow[];
    earliestPresale: Date;
    allWindows: PresaleWindow[];
    eventDates: Date[];
    firstRow: GroupedPresaleRow;
  };

  const groupMap = new Map<string, PresaleGroup>();
  const groupOrder: string[] = [];

  for (const row of presales) {
    // Group by primary artist + venue
    const primaryArtist = row.artists.find((a) => a.isPrimary);
    const artistKey = primaryArtist?.name ?? row.event.name;
    const venueKey = row.venue?.id ?? "none";
    const key = `${artistKey}-${venueKey}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        rows: [],
        earliestPresale: row.earliestStart,
        allWindows: [],
        eventDates: [],
        firstRow: row,
      });
      groupOrder.push(key);
    }

    const group = groupMap.get(key)!;
    group.rows.push(row);
    group.allWindows.push(...row.windows);
    if (row.event.eventDate) group.eventDates.push(row.event.eventDate);
    if (row.earliestStart < group.earliestPresale) {
      group.earliestPresale = row.earliestStart;
      group.firstRow = row;
    }
  }

  const grouped = groupOrder.map((k) => groupMap.get(k)!);

  // Deduplicate windows by type for display
  function uniqueWindows(windows: PresaleWindow[]): PresaleWindow[] {
    const seen = new Set<string>();
    return windows.filter((w) => {
      const key = `${w.windowType}-${w.windowName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Aggregate code counts across all events in group
  function groupCodeCount(g: PresaleGroup): number {
    return g.rows.reduce((sum, r) => sum + (codeCounts.get(r.event.id) ?? 0), 0);
  }

  // Unique event dates for display
  function uniqueDates(dates: Date[]): Date[] {
    const seen = new Set<string>();
    return dates.filter((d) => {
      const key = format(d, "yyyy-MM-dd");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => a.getTime() - b.getTime());
  }

  // Group by presale day for date headers
  let lastDateKey = "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upcoming Onsales</h1>
        <p className="text-muted-foreground">
          {totalCount} upcoming events with presales or general onsales
        </p>
      </div>

      <PresaleFilters
        venues={filterOptions.venues}
        genres={filterOptions.genres}
        segments={filterOptions.segments}
        currentVenues={venueIds}
        currentGenres={genres}
        currentSegment={segment}
        currentType={windowType}
        currentSearch={search}
      />

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No upcoming onsales match your filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {grouped.map((g) => {
            const row = g.firstRow;
            const dateKey = format(g.earliestPresale, "yyyy-MM-dd");
            const showDateHeader = dateKey !== lastDateKey;
            lastDateKey = dateKey;
            const dates = uniqueDates(g.eventDates);
            const windows = uniqueWindows(g.allWindows);
            const codes = groupCodeCount(g);
            const isMultiDate = dates.length > 1;

            return (
              <div key={g.key}>
                {showDateHeader && (
                  <div className="flex items-center gap-3 pt-4 pb-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      {format(g.earliestPresale, "EEEE, MMMM d, yyyy")}
                    </h2>
                    {urgencyLabel(g.earliestPresale)}
                  </div>
                )}
                <Link href={`/events/${row.event.slug}`}>
                  <Card className="transition-colors hover:bg-muted/30">
                    <CardContent className="flex items-center gap-4 py-3">
                      {/* Image thumbnail */}
                      {row.event.imageUrl ? (
                        <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-md sm:block">
                          <img
                            src={row.event.imageUrl}
                            alt={row.event.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="hidden h-16 w-24 shrink-0 items-center justify-center rounded-md bg-muted sm:flex">
                          <Ticket className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}

                      {/* Main content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Window type badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {windows.map((w) => windowBadge(w))}
                          {isMultiDate && (
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                              <CalendarDays className="mr-0.5 h-2.5 w-2.5" />
                              {dates.length} shows
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(g.earliestPresale, "h:mm a")}
                          </span>
                        </div>

                        <h3 className="truncate font-semibold leading-tight">
                          {row.event.name}
                        </h3>

                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          {isMultiDate ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {dates.map((d) => format(d, "MMM d")).join(", ")}
                            </span>
                          ) : (
                            row.event.eventDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(row.event.eventDate, "EEE, MMM d, yyyy")}
                              </span>
                            )
                          )}
                          {row.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {row.venue.name}
                            </span>
                          )}
                          {row.artists.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Music className="h-3 w-3" />
                              {row.artists
                                .slice(0, 2)
                                .map((a) => a.name)
                                .join(", ")}
                              {row.artists.length > 2 && ` +${row.artists.length - 2}`}
                            </span>
                          )}
                          {(row.event.priceMin || row.event.priceMax) && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatPrice(row.event.priceMin, row.event.priceMax, row.event.currency)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Countdown */}
                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="text-xs text-muted-foreground">Starts</p>
                        <p className="text-sm font-medium text-amber-600">
                          {formatDistanceToNow(g.earliestPresale, { addSuffix: true })}
                        </p>
                        {row.event.genre && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {row.event.genre}
                          </Badge>
                        )}
                        {codes > 0 && (
                          <Badge className="mt-1 bg-purple-50 text-purple-700 border-purple-200 text-xs">
                            {codes} code{codes > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            );
          })}
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
