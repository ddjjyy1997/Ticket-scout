import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const artists = pgTable(
  "artists",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    normalizedName: text("normalized_name").notNull(),
    tmAttractionId: text("tm_attraction_id"),
    sgPerformerId: integer("sg_performer_id"),
    genre: text("genre"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("artists_normalized_name_idx").on(table.normalizedName),
    index("artists_tm_attraction_id_idx").on(table.tmAttractionId),
  ]
);
