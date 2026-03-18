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
  TrendingUp,
  Eye,
  Radio,
  Ticket,
  Clock,
  MapPin,
  Music,
  ExternalLink,
} from "lucide-react";
import { getDashboardStats, getRecentEvents, getUpcomingOnsales } from "@/db/queries/dashboard";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

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

export default async function DashboardPage() {
  const [stats, recentEvents, upcomingOnsales] = await Promise.all([
    getDashboardStats(),
    getRecentEvents(8),
    getUpcomingOnsales(8),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Track releases, analyze resale opportunities, and monitor your
          watchlist.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Future events tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Onsales
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingOnsales}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recently Added
            </CardTitle>
            <Radio className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentlyAdded}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Scan
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastScan
                ? stats.lastScan.eventsFound ?? 0
                : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastScan?.completedAt
                ? formatDistanceToNow(stats.lastScan.completedAt, { addSuffix: true })
                : "No scans yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recently added events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              Recently Added Events
            </CardTitle>
            <CardDescription>
              Latest events detected from scans
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Ticket className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No events yet. Run your first scan from the Admin page.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{event.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.venue.name}
                          </span>
                        )}
                        {event.eventDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(event.eventDate, "MMM d, yyyy")}
                          </span>
                        )}
                        {event.artists?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {event.artists
                              .map((ea) => ea.artist.name)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {statusBadge(event.status)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming onsales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Upcoming Onsales
            </CardTitle>
            <CardDescription>Next onsale windows</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingOnsales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No upcoming onsales detected yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingOnsales.map((row) => (
                  <Link
                    key={row.windowId}
                    href={`/events/${row.eventSlug}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <p className="truncate text-sm font-medium">{row.eventName}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        className={
                          row.windowType === "general"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }
                      >
                        {row.windowName ?? row.windowType}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.startDate
                        ? format(row.startDate, "MMM d, yyyy 'at' h:mm a")
                        : "TBD"}
                    </p>
                    {row.venueName && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.venueName}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            Database: Connected
          </Badge>
          <Badge variant="outline" className={stats.lastScan ? "text-emerald-600 border-emerald-200" : "text-muted-foreground"}>
            Last scan: {stats.lastScan?.completedAt
              ? formatDistanceToNow(stats.lastScan.completedAt, { addSuffix: true })
              : "Never"}
          </Badge>
          <Badge variant="outline" className={stats.lastScan?.status === "completed" ? "text-emerald-600 border-emerald-200" : "text-amber-600 border-amber-200"}>
            Ticketmaster: {stats.lastScan?.status === "completed" ? "Active" : "Pending"}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            SeatGeek: On-demand
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
