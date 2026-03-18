import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export interface SavedViewFilters {
  venue?: string; // comma-separated venue IDs (e.g. "1,3,11")
  genre?: string; // comma-separated genres
  segment?: string;
  status?: string; // comma-separated statuses
  minScore?: number;
  sort?: string;
  search?: string;
}

export const savedViews = pgTable(
  "saved_views",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    filters: jsonb("filters").notNull().$type<SavedViewFilters>().default({}),
    notifyEnabled: boolean("notify_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("saved_views_user_id_idx").on(table.userId),
    unique("saved_views_user_name_unique").on(table.userId, table.name),
  ]
);

export const savedViewsRelations = relations(savedViews, ({ one }) => ({
  user: one(users, {
    fields: [savedViews.userId],
    references: [users.id],
  }),
}));
