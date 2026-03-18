import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const scanRuns = pgTable(
  "scan_runs",
  {
    id: serial("id").primaryKey(),
    runType: text("run_type").notNull(), // 'full_scan' | 'venue_scan' | 'resale_enrich'
    status: text("status").notNull().default("running"),
    triggeredBy: text("triggered_by").notNull().default("cron"),
    eventsFound: integer("events_found").notNull().default(0),
    eventsCreated: integer("events_created").notNull().default(0),
    eventsUpdated: integer("events_updated").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    durationMs: integer("duration_ms"),
    metadata: jsonb("metadata"),
    startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => [
    index("scan_runs_started_at_idx").on(table.startedAt),
    index("scan_runs_status_idx").on(table.status),
  ]
);

export const scanLogs = pgTable(
  "scan_logs",
  {
    id: serial("id").primaryKey(),
    scanRunId: integer("scan_run_id")
      .notNull()
      .references(() => scanRuns.id, { onDelete: "cascade" }),
    level: text("level").notNull(), // 'info' | 'warn' | 'error'
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("scan_logs_scan_run_id_idx").on(table.scanRunId)]
);

export const scanRunsRelations = relations(scanRuns, ({ many }) => ({
  logs: many(scanLogs),
}));

export const scanLogsRelations = relations(scanLogs, ({ one }) => ({
  scanRun: one(scanRuns, {
    fields: [scanLogs.scanRunId],
    references: [scanRuns.id],
  }),
}));
