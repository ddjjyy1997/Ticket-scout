import { getEventBySlug } from "@/db/queries/events";
import { db } from "@/db";
import { presaleCodes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { format, isFuture } from "date-fns";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Music,
  Ticket,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found | TicketScout" };

  const venue = event.venue?.name ?? "";
  const date = event.eventDate ? format(event.eventDate, "MMM d, yyyy") : "";

  return {
    title: `${event.name} — Presale Codes & Info | TicketScout`,
    description: `Get presale codes, onsale times, and alerts for ${event.name}${venue ? ` at ${venue}` : ""}${date ? ` on ${date}` : ""}. Never miss a presale again.`,
    openGraph: {
      title: `${event.name} — Presale Codes | TicketScout`,
      description: `Presale codes and onsale info for ${event.name}${venue ? ` at ${venue}` : ""}.`,
      images: event.imageUrl ? [event.imageUrl] : [],
    },
  };
}

export default async function ShareEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return notFound();

  // Get presale codes for this event
  const codes = await db
    .select()
    .from(presaleCodes)
    .where(eq(presaleCodes.eventId, event.id))
    .orderBy(desc(presaleCodes.confirmedWorking));

  const upcomingPresales = event.onsaleWindows?.filter(
    (w) => w.windowType !== "general" && isFuture(w.startDate)
  ) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Event Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="h-48 w-full object-cover sm:h-56"
          />
        )}
        <div className="p-6">
          <h1 className="text-2xl font-bold">{event.name}</h1>

          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {event.eventDate && (
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                {format(event.eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            )}
            {event.venue && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                {event.venue.name}
                {event.venue.city && `, ${event.venue.city}`}
              </p>
            )}
            {event.artists && event.artists.length > 0 && (
              <p className="flex items-center gap-2">
                <Music className="h-4 w-4 shrink-0" />
                {event.artists.map((ea) => ea.artist.name).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Presale Codes */}
      {codes.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Ticket className="h-5 w-5 text-purple-600" />
            Presale Codes
          </h2>
          <div className="mt-4 space-y-3">
            {codes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3"
              >
                <div>
                  <code className="text-lg font-mono font-bold tracking-wider">
                    {code.code}
                  </code>
                  {code.notes && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{code.notes}</p>
                  )}
                </div>
                {code.confirmedWorking > 0 && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {code.confirmedWorking} confirmed
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Presales */}
      {upcomingPresales.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-amber-600" />
            Upcoming Presales
          </h2>
          <div className="mt-4 space-y-2">
            {upcomingPresales.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
              >
                <span className="font-medium">{w.windowName ?? w.windowType}</span>
                <span className="text-xs text-muted-foreground">
                  {format(w.startDate, "MMM d 'at' h:mm a")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
        <img src="/logo.png" alt="TicketScout" className="mx-auto h-12 w-12 object-contain" />
        <h3 className="mt-3 text-lg font-bold">Never Miss a Presale Again</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get presale codes, alerts, and buy/sell scores for every major event across North America.
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Sign Up Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-6 text-sm font-medium hover:bg-muted transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
