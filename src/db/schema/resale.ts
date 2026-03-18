import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { events } from "./events";

export const resaleListingsSummary = pgTable(
  "resale_listings_summary",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // 'seatgeek'
    snapshotDate: timestamp("snapshot_date", { mode: "date" })
      .notNull()
      .defaultNow(),
    listingCount: integer("listing_count"),
    lowestPrice: numeric("lowest_price"),
    highestPrice: numeric("highest_price"),
    averagePrice: numeric("average_price"),
    medianPrice: numeric("median_price"),
    currency: text("currency").default("CAD"),
    sgScore: numeric("sg_score"),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("resale_event_snapshot_idx").on(table.eventId, table.snapshotDate),
    index("resale_event_source_idx").on(table.eventId, table.source),
  ]
);

export const resaleListingsSummaryRelations = relations(
  resaleListingsSummary,
  ({ one }) => ({
    event: one(events, {
      fields: [resaleListingsSummary.eventId],
      references: [events.id],
    }),
  })
);
