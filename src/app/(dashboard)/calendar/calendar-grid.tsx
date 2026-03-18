"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";

interface CalendarEvent {
  id: number;
  name: string;
  slug: string;
  eventDate: string; // ISO string
  genre: string | null;
  status: string;
  venueName: string | null;
  artists: string[];
}

interface CalendarOnsale {
  windowId: number;
  windowType: string;
  windowName: string | null;
  startDate: string; // ISO string
  eventName: string;
  eventSlug: string;
  venueName: string | null;
}

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
  onsales: CalendarOnsale[];
}

export function CalendarGrid({ year, month, events, onsales }: CalendarGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMonth = new Date(year, month, 1);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Group events and onsales by date
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const evt of events) {
    const key = format(new Date(evt.eventDate), "yyyy-MM-dd");
    const list = eventsByDate.get(key) ?? [];
    list.push(evt);
    eventsByDate.set(key, list);
  }

  const onsalesByDate = new Map<string, CalendarOnsale[]>();
  for (const os of onsales) {
    const key = format(new Date(os.startDate), "yyyy-MM-dd");
    const list = onsalesByDate.get(key) ?? [];
    list.push(os);
    onsalesByDate.set(key, list);
  }

  function navigateMonth(offset: number) {
    const next = new Date(year, month + offset, 1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(next.getFullYear()));
    params.set("month", String(next.getMonth()));
    router.push(`/calendar?${params.toString()}`);
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-lg border border-border">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {weekdays.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate.get(key) ?? [];
            const dayOnsales = onsalesByDate.get(key) ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={key}
                className={`min-h-[100px] border-b border-r border-border p-1 ${
                  !inMonth ? "bg-muted/10 opacity-40" : ""
                } ${today ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center justify-between px-1">
                  <span
                    className={`text-xs ${
                      today
                        ? "font-bold text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {(dayEvents.length > 0 || dayOnsales.length > 0) && (
                    <div className="flex gap-0.5">
                      {dayEvents.length > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                      {dayOnsales.length > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-0.5 space-y-0.5">
                  {/* Onsale windows first (more actionable) */}
                  {dayOnsales.slice(0, 2).map((os) => (
                    <Link
                      key={`os-${os.windowId}`}
                      href={`/events/${os.eventSlug}`}
                      className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight bg-purple-50 text-purple-700 hover:bg-purple-100"
                      title={`${os.windowName ?? os.windowType}: ${os.eventName}`}
                    >
                      <span className="font-medium">
                        {format(new Date(os.startDate), "h:mma").toLowerCase()}
                      </span>{" "}
                      {os.eventName}
                    </Link>
                  ))}

                  {/* Events */}
                  {dayEvents.slice(0, 2 - Math.min(dayOnsales.length, 2)).map((evt) => (
                    <Link
                      key={`ev-${evt.id}`}
                      href={`/events/${evt.slug}`}
                      className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight bg-blue-50 text-blue-700 hover:bg-blue-100"
                      title={evt.name}
                    >
                      {evt.name}
                    </Link>
                  ))}

                  {/* Overflow indicator */}
                  {dayEvents.length + dayOnsales.length > 2 && (
                    <p className="px-1 text-[10px] text-muted-foreground">
                      +{dayEvents.length + dayOnsales.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Events
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          Onsales / Presales
        </div>
      </div>
    </div>
  );
}
