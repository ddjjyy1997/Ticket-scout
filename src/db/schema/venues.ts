import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const venues = pgTable(
  "venues",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    city: text("city").notNull().default("Toronto"),
    province: text("province").default("ON"),
    country: text("country").default("CA"),
    capacity: integer("capacity"),
    tmVenueId: text("tm_venue_id"), // Ticketmaster Discovery API ID
    sgVenueId: integer("sg_venue_id"), // SeatGeek venue ID
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("venues_tm_venue_id_idx").on(table.tmVenueId),
    index("venues_sg_venue_id_idx").on(table.sgVenueId),
    index("venues_slug_idx").on(table.slug),
  ]
);
