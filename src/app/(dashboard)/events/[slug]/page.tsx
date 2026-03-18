import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Music,
  DollarSign,
  Clock,
  ExternalLink,
  ArrowLeft,
  Ticket,
  Tag,
} from "lucide-react";
import { getEventBySlug } from "@/db/queries/events";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { eventScores, resaleListingsSummary } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AnalyzePanel } from "./analyze-panel";
import { PresaleCodesSection } from "./presale-codes";
import { auth } from "@/lib/auth";
import { getSignupInfo } from "@/lib/presale-signup";
import { SignupUrlEditor } from "./signup-url-editor";
import { BackButton } from "@/components/back-button";
import { ShareButton } from "@/components/share-button";
import { SimilarEvents } from "./similar-events";

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
    <Badge className={`text-sm ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </Badge>
  );
}

function windowBadge(type: string) {
  const colors: Record<string, string> = {
    general: "bg-emerald-50 text-emerald-700 border-emerald-200",
    presale: "bg-purple-50 text-purple-700 border-purple-200",
    amex: "bg-blue-50 text-blue-700 border-blue-200",
    fan_club: "bg-pink-50 text-pink-700 border-pink-200",
    spotify: "bg-green-50 text-green-700 border-green-200",
    artist: "bg-orange-50 text-orange-700 border-orange-200",
    venue: "bg-cyan-50 text-cyan-700 border-cyan-200",
  };
  return colors[type] ?? "bg-muted text-muted-foreground";
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, session] = await Promise.all([
    getEventBySlug(slug),
    auth(),
  ]);

  if (!event) return notFound();

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin";
  const plan = isAdmin ? "pro" : ((session?.user as { plan?: string } | undefined)?.plan ?? "free");

  const tmSource = event.sources?.find((s) => s.source === "ticketmaster");

  // Load existing scores and resale data
  const [existingScores] = await db
    .select()
    .from(eventScores)
    .where(eq(eventScores.eventId, event.id))
    .limit(1);

  const [latestResale] = await db
    .select()
    .from(resaleListingsSummary)
    .where(eq(resaleListingsSummary.eventId, event.id))
    .orderBy(desc(resaleListingsSummary.snapshotDate))
    .limit(1);

  const initialBuy = existingScores?.buyScore
    ? {
        buyScore: parseFloat(existingScores.buyScore),
        buyConfidence: parseFloat(existingScores.buyConfidence),
        recommendation: existingScores.buyRecommendation as string,
        expectedRoiBand: existingScores.expectedRoiBand as string,
        components: existingScores.buyInputs as Record<string, number>,
      }
    : null;

  const initialSell = existingScores?.sellScore
    ? {
        sellScore: parseFloat(existingScores.sellScore),
        sellConfidence: parseFloat(existingScores.sellConfidence),
        recommendation: existingScores.sellRecommendation as string,
        marketPhase: existingScores.marketPhase as string,
        profitEstimatePct: existingScores.profitEstimatePct
          ? parseFloat(existingScores.profitEstimatePct)
          : null,
        profitEstimateAmt: existingScores.profitEstimateAmt
          ? parseFloat(existingScores.profitEstimateAmt)
          : null,
        components: existingScores.sellInputs as Record<string, number>,
      }
    : null;

  const initialResale = latestResale
    ? {
        listingCount: latestResale.listingCount,
        lowestPrice: latestResale.lowestPrice,
        medianPrice: latestResale.medianPrice,
        highestPrice: latestResale.highestPrice,
        sgScore: latestResale.sgScore,
        sgUrl: (latestResale.rawData as Record<string, unknown>)?.sgUrl as string | null ?? null,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Back link — uses browser back to preserve filters */}
      <BackButton fallback="/events" />

      {/* Hero section */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {event.imageUrl && (
          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg lg:w-80 lg:shrink-0">
            <img
              src={event.imageUrl}
              alt={event.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold leading-tight">{event.name}</h1>
            {statusBadge(event.status)}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            {event.eventDate && (
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                {format(event.eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                <span className="text-xs">
                  ({isFuture(event.eventDate)
                    ? formatDistanceToNow(event.eventDate, { addSuffix: true })
                    : "past"})
                </span>
              </p>
            )}
            {event.venue && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                {event.venue.name}
                {event.venue.city && `, ${event.venue.city}`}
                {event.venue.capacity && (
                  <span className="text-xs">
                    (capacity: {event.venue.capacity.toLocaleString()})
                  </span>
                )}
              </p>
            )}
            {event.artists && event.artists.length > 0 && (
              <p className="flex items-center gap-2">
                <Music className="h-4 w-4 shrink-0" />
                {event.artists.map((ea) => ea.artist.name).join(", ")}
              </p>
            )}
            {(event.priceMin || event.priceMax) && (
              <p className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 shrink-0" />
                {event.priceMin && event.priceMax && event.priceMin !== event.priceMax
                  ? `$${parseFloat(event.priceMin).toFixed(0)} - $${parseFloat(event.priceMax).toFixed(0)}`
                  : `$${parseFloat(event.priceMin ?? event.priceMax!).toFixed(0)}`}
                {" "}{event.currency ?? "CAD"}
              </p>
            )}
            {event.genre && (
              <p className="flex items-center gap-2">
                <Tag className="h-4 w-4 shrink-0" />
                {event.genre}
                {event.subGenre && ` / ${event.subGenre}`}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {tmSource?.sourceUrl && (
              <a
                href={tmSource.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Ticket className="h-4 w-4" />
                Buy on Ticketmaster
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <ShareButton url={`/events/${event.slug}`} title={event.name} />
          </div>
        </div>
      </div>

      {/* All Games/Shows — same artist events listed prominently at top */}
      <SimilarEvents
        eventId={event.id}
        genre={event.genre}
        venueId={event.venueId}
        artistIds={event.artists?.map((ea) => ea.artist.id) ?? []}
        artistName={event.artists?.find((ea) => ea.isPrimary)?.artist.name ?? event.artists?.[0]?.artist.name}
        segment={event.segment}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Onsale Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Onsale Timeline
            </CardTitle>
            <CardDescription>
              Presale and general onsale windows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {event.onsaleWindows && event.onsaleWindows.length > 0 ? (
              <div className="space-y-3">
                {event.onsaleWindows
                  .sort(
                    (a, b) =>
                      new Date(a.startDate).getTime() -
                      new Date(b.startDate).getTime()
                  )
                  .map((w) => {
                    const isActive =
                      isFuture(w.endDate ?? new Date("2099-01-01")) &&
                      isPast(w.startDate);
                    const isUpcoming = isFuture(w.startDate);
                    return (
                      <div
                        key={w.id}
                        className={`rounded-lg border p-3 ${
                          isActive
                            ? "border-emerald-200 bg-emerald-50"
                            : isUpcoming
                            ? "border-amber-200 bg-amber-50"
                            : "opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={windowBadge(w.windowType)}>
                              {w.windowName ?? w.windowType}
                            </Badge>
                            {isActive && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                LIVE
                              </Badge>
                            )}
                            {isUpcoming && !isActive && (
                              <span className="text-xs text-amber-600">
                                {formatDistanceToNow(w.startDate, {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                          </div>
                          {(isUpcoming || isActive) && (() => {
                            const primaryArtistName = event.artists?.[0]?.artist?.name;
                            const url = w.signupUrl || getSignupInfo(w.windowName, primaryArtistName)?.url;
                            if (!url || w.windowType === "general") return null;
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                              >
                                Sign Up
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            );
                          })()}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(w.startDate, "MMM d, yyyy 'at' h:mm a")}
                          {w.endDate &&
                            ` — ${format(w.endDate, "MMM d, yyyy 'at' h:mm a")}`}
                        </p>
                        {isAdmin && (isUpcoming || isActive) && w.windowType !== "general" && (
                          <SignupUrlEditor
                            windowId={w.id}
                            currentUrl={w.signupUrl ?? null}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No onsale windows detected for this event.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Event Info sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                {statusBadge(event.status)}
              </div>
              {event.isSoldOut && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Availability</span>
                  <Badge className="bg-red-50 text-red-700 border-red-200">
                    Sold Out
                  </Badge>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Added</span>
                <span>
                  {format(event.createdAt, "MMM d, yyyy")}
                </span>
              </div>
              {event.lastScannedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>
                    {formatDistanceToNow(event.lastScannedAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
              {event.sources && event.sources.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sources</span>
                  <span>
                    {event.sources.map((s) => s.source).join(", ")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Artists */}
          {event.artists && event.artists.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Artists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.artists.map((ea) => (
                    <div
                      key={ea.artistId}
                      className="flex items-center gap-3 rounded-lg border p-2"
                    >
                      {ea.artist.imageUrl ? (
                        <img
                          src={ea.artist.imageUrl}
                          alt={ea.artist.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{ea.artist.name}</p>
                        {ea.artist.genre && (
                          <p className="text-xs text-muted-foreground">
                            {ea.artist.genre}
                          </p>
                        )}
                      </div>
                      {ea.isPrimary && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Presale Codes — only show if there are presale windows that haven't all passed */}
      {event.onsaleWindows && event.onsaleWindows.some((w) =>
        w.windowType !== "general" && (isFuture(w.startDate) || (w.endDate && isFuture(w.endDate)))
      ) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-purple-600" />
              Presale Codes
            </CardTitle>
            <CardDescription>
              Community-submitted presale codes for this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PresaleCodesSection
              eventId={event.id}
              plan={plan}
              onsaleWindows={(event.onsaleWindows ?? [])
                .filter((w) => w.windowType !== "general" && (isFuture(w.startDate) || (w.endDate && isFuture(w.endDate))))
                .map((w) => ({
                  id: w.id,
                  windowType: w.windowType,
                  windowName: w.windowName ?? null,
                }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Resale Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2" />
        <AnalyzePanel
          eventId={event.id}
          initialBuy={initialBuy}
          initialSell={initialSell}
          initialResale={initialResale}
        />
      </div>

    </div>
  );
}
