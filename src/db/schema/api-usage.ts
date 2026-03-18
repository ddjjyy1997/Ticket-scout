import {
  pgTable,
  serial,
  text,
  integer,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const apiUsageLogs = pgTable(
  "api_usage_logs",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(), // 'ticketmaster' | 'seatgeek'
    endpoint: text("endpoint").notNull(),
    method: text("method").notNull().default("GET"),
    statusCode: integer("status_code"),
    responseTimeMs: integer("response_time_ms"),
    callDate: date("call_date").notNull().defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("api_usage_source_date_idx").on(table.source, table.callDate),
    index("api_usage_date_idx").on(table.callDate),
  ]
);
