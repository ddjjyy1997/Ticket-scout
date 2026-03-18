import { getSimilarEvents } from "@/db/queries/similar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Ticket, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getScoreBg } from "@/types";

interface SimilarEventsProps {
  eventId: number;
  genre: string | null;
  venueId: number | null;
  artistIds: number[];
}

export async function SimilarEvents({
  eventId,
  genre,
  venueId,
  artistIds,
}: SimilarEventsProps) {
  const similar = await getSimilarEvents(eventId, {
    genre,
    venueId,
    artistIds,
  });

  if (similar.length === 0) return null;

  const reasonLabel = { artist: "Same Artist", venue: "Same Venue", genre: "Same Genre" };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          You Might Also Like
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {similar.map((e) => (
            <Link
              key={e.id}
              href={`/events/${e.slug}`}
              className="flex w-56 shrink-0 flex-col overflow-hidden rounded-lg border border-border transition-colors hover:bg-muted/30"
            >
              {e.imageUrl ? (
                <div className="h-28 w-full overflow-hidden">
                  <img
                    src={e.imageUrl}
                    alt={e.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-muted">
                  <Ticket className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1 p-3">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {reasonLabel[e.matchReason]}
                  </Badge>
                  {e.hasUpcomingPresale && (
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                      Presale
                    </Badge>
                  )}
                  {e.buyScore !== null && (
                    <Badge className={`text-[10px] ${getScoreBg(e.buyScore)}`}>
                      {e.buyScore}
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-medium leading-tight">
                  {e.name}
                </p>
                <div className="mt-auto space-y-0.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(e.eventDate, "MMM d, yyyy")}
                  </p>
                  {e.venueName && (
                    <p className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {e.venueName}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
