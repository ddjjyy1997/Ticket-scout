import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emailNotifications: boolean("email_notifications").notNull().default(true),
    pushNotifications: boolean("push_notifications").notNull().default(true),
    notifyCity: text("notify_city"), // auto-notify about presales in this city
    notifyOnsale: boolean("notify_onsale").notNull().default(true),
    notifyPriceDrop: boolean("notify_price_drop").notNull().default(true),
    notifyNewEvents: boolean("notify_new_events").notNull().default(true),
    priceDropThreshold: integer("price_drop_threshold").default(15),
    timezone: text("timezone").default("America/Toronto"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("user_preferences_user_id_unique").on(table.userId),
  ]
);

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userPreferences.userId],
      references: [users.id],
    }),
  })
);
