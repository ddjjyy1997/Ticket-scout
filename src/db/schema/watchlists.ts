import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { events } from "./events";
import { artists } from "./artists";
import { venues } from "./venues";

export const watchlists = pgTable(
  "watchlists",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Default"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("watchlists_user_id_idx").on(table.userId)]
);

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: serial("id").primaryKey(),
    watchlistId: integer("watchlist_id")
      .notNull()
      .references(() => watchlists.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(), // 'event' | 'artist' | 'venue'
    eventId: integer("event_id").references(() => events.id),
    artistId: integer("artist_id").references(() => artists.id),
    venueId: integer("venue_id").references(() => venues.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("watchlist_items_event_unique").on(
      table.watchlistId,
      table.itemType,
      table.eventId
    ),
    unique("watchlist_items_artist_unique").on(
      table.watchlistId,
      table.itemType,
      table.artistId
    ),
    unique("watchlist_items_venue_unique").on(
      table.watchlistId,
      table.itemType,
      table.venueId
    ),
  ]
);

export const watchlistsRelations = relations(watchlists, ({ one, many }) => ({
  user: one(users, { fields: [watchlists.userId], references: [users.id] }),
  items: many(watchlistItems),
}));

export const watchlistItemsRelations = relations(
  watchlistItems,
  ({ one }) => ({
    watchlist: one(watchlists, {
      fields: [watchlistItems.watchlistId],
      references: [watchlists.id],
    }),
    event: one(events, {
      fields: [watchlistItems.eventId],
      references: [events.id],
    }),
    artist: one(artists, {
      fields: [watchlistItems.artistId],
      references: [artists.id],
    }),
    venue: one(venues, {
      fields: [watchlistItems.venueId],
      references: [venues.id],
    }),
  })
);
