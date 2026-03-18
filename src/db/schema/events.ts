import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  index,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { venues } from "./venues";
import { artists } from "./artists";

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    venueId: integer("venue_id").references(() => venues.id),
    eventDate: timestamp("event_date", { mode: "date" }).notNull(),
    eventEndDate: timestamp("event_end_date", { mode: "date" }),
    genre: text("genre"),
    subGenre: text("sub_genre"),
    segment: text("segment"),
    imageUrl: text("image_url"),
    status: text("status").notNull().default("announced"),
    priceMin: numeric("price_min"),
    priceMax: numeric("price_max"),
    currency: text("currency").default("CAD"),
    ticketLimit: integer("ticket_limit"),
    isSoldOut: boolean("is_sold_out").default(false),
    lastScannedAt: timestamp("last_scanned_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("events_event_date_idx").on(table.eventDate),
    index("events_venue_id_idx").on(table.venueId),
    index("events_status_idx").on(table.status),
  ]
);

export const eventSources = pgTable(
  "event_sources",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // 'ticketmaster' | 'seatgeek'
    sourceEventId: text("source_event_id").notNull(),
    sourceUrl: text("source_url"),
    rawData: jsonb("raw_data"),
    matchConfidence: numeric("match_confidence"),
    lastSyncedAt: timestamp("last_synced_at", { mode: "date" }).defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("event_sources_source_event_id_unique").on(
      table.source,
      table.sourceEventId
    ),
    index("event_sources_event_id_idx").on(table.eventId),
  ]
);

export const eventArtists = pgTable(
  "event_artists",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    artistId: integer("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").default(true),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.artistId] })]
);

export const onsaleWindows = pgTable(
  "onsale_windows",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    windowType: text("window_type").notNull(), // 'presale' | 'general' | etc
    windowName: text("window_name"),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }),
    accessCode: text("access_code"),
    signupUrl: text("signup_url"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("onsale_windows_event_id_idx").on(table.eventId),
    index("onsale_windows_start_date_idx").on(table.startDate),
  ]
);

// Relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, { fields: [events.venueId], references: [venues.id] }),
  sources: many(eventSources),
  artists: many(eventArtists),
  onsaleWindows: many(onsaleWindows),
}));

export const eventSourcesRelations = relations(eventSources, ({ one }) => ({
  event: one(events, {
    fields: [eventSources.eventId],
    references: [events.id],
  }),
}));

export const eventArtistsRelations = relations(eventArtists, ({ one }) => ({
  event: one(events, {
    fields: [eventArtists.eventId],
    references: [events.id],
  }),
  artist: one(artists, {
    fields: [eventArtists.artistId],
    references: [artists.id],
  }),
}));

export const onsaleWindowsRelations = relations(onsaleWindows, ({ one }) => ({
  event: one(events, {
    fields: [onsaleWindows.eventId],
    references: [events.id],
  }),
}));
