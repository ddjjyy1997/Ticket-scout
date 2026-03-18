import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { events, onsaleWindows } from "./events";

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: integer("event_id").references(() => events.id),
    type: text("type").notNull(), // 'onsale_alert' | 'price_drop' | 'new_event' | 'watchlist_match' | 'onsale_reminder'
    onsaleWindowId: integer("onsale_window_id").references(() => onsaleWindows.id),
    title: text("title").notNull(),
    message: text("message").notNull(),
    channel: text("channel").notNull().default("in_app"),
    isRead: boolean("is_read").notNull().default(false),
    sentAt: timestamp("sent_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_read_idx").on(table.userId, table.isRead),
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [notifications.eventId],
    references: [events.id],
  }),
}));
