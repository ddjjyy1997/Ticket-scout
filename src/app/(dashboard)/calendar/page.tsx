import { getCalendarEvents, getCalendarOnsales } from "@/db/queries/calendar";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { CalendarGrid } from "./calendar-grid";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year =
    typeof params.year === "string" ? parseInt(params.year) : now.getFullYear();
  const month =
    typeof params.month === "string" ? parseInt(params.month) : now.getMonth();

  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  // Extend to cover full weeks shown in calendar
  const from = startOfWeek(monthStart);
  const to = endOfWeek(monthEnd);

  const [calEvents, calOnsales] = await Promise.all([
    getCalendarEvents(from, to),
    getCalendarOnsales(from, to),
  ]);

  // Serialize dates for client component
  const serializedEvents = calEvents.map((e) => ({
    ...e,
    eventDate: e.eventDate.toISOString(),
  }));

  const serializedOnsales = calOnsales.map((o) => ({
    ...o,
    startDate: o.startDate.toISOString(),
    eventDate: o.eventDate.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">
          Events and onsale windows at a glance
        </p>
      </div>

      <CalendarGrid
        year={year}
        month={month}
        events={serializedEvents}
        onsales={serializedOnsales}
      />
    </div>
  );
}
