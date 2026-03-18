"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  CheckCheck,
  Music,
  MapPin,
  Eye,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  eventId: number | null;
  createdAt: string;
}

function typeIcon(type: string) {
  switch (type) {
    case "watchlist_match":
      return <Eye className="h-4 w-4 text-purple-600" />;
    case "onsale_alert":
      return <Bell className="h-4 w-4 text-amber-600" />;
    case "new_event":
      return <Music className="h-4 w-4 text-blue-600" />;
    case "onsale_reminder":
      return <Clock className="h-4 w-4 text-orange-600" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function typeBadge(type: string) {
  const labels: Record<string, string> = {
    watchlist_match: "Watchlist",
    onsale_alert: "Onsale",
    new_event: "New Event",
    price_drop: "Price Drop",
    onsale_reminder: "Reminder",
  };
  const colors: Record<string, string> = {
    watchlist_match: "bg-purple-50 text-purple-700 border-purple-200",
    onsale_alert: "bg-amber-50 text-amber-700 border-amber-200",
    new_event: "bg-blue-50 text-blue-700 border-blue-200",
    price_drop: "bg-emerald-50 text-emerald-700 border-emerald-200",
    onsale_reminder: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <Badge className={colors[type] ?? "bg-muted text-muted-foreground"}>
      {labels[type] ?? type}
    </Badge>
  );
}

export function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markRead(id: number) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", notificationId: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* How to get notifications hint */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">How to get notifications:</strong>{" "}
          Go to{" "}
          <Link href="/events" className="text-primary hover:underline">Events</Link>
          , set your filters, then click <strong>Save current view</strong> and enable notifications.
          You can also{" "}
          <Link href="/watchlist" className="text-primary hover:underline">watch artists & venues</Link>
          {" "}to get alerts when new events are announced or presales are about to start.
        </p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No notifications yet. Save a view with notifications enabled, or add artists to your watchlist.
            </p>
            <div className="mt-3 flex gap-3">
              <Link href="/events" className="text-sm text-primary hover:underline">
                Browse Events
              </Link>
              <Link href="/watchlist" className="text-sm text-primary hover:underline">
                Go to Watchlist
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-colors ${
                !notif.isRead ? "border-primary/20 bg-primary/5" : ""
              }`}
            >
              <CardContent className="flex items-start gap-3 py-3">
                <div className="mt-0.5">{typeIcon(notif.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{notif.title}</p>
                    {typeBadge(notif.type)}
                    {!notif.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {notif.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {notif.eventId && (
                    <Link
                      href={`/events/${notif.eventId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View Event
                    </Link>
                  )}
                  {!notif.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markRead(notif.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
