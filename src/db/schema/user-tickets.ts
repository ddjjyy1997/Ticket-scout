import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { events } from "./events";

export const userTickets = pgTable(
  "user_tickets",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    section: text("section"),
    row: text("row"),
    seat: text("seat"),
    quantity: integer("quantity").notNull().default(1),
    purchasePrice: numeric("purchase_price").notNull(),
    purchaseCurrency: text("purchase_currency").default("CAD"),
    purchaseDate: timestamp("purchase_date", { mode: "date" }),
    source: text("source"), // 'ticketmaster' | 'stubhub' | 'manual' etc
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("user_tickets_user_id_idx").on(table.userId),
    index("user_tickets_event_id_idx").on(table.eventId),
  ]
);

export const userTicketsRelations = relations(userTickets, ({ one }) => ({
  user: one(users, {
    fields: [userTickets.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [userTickets.eventId],
    references: [events.id],
  }),
}));
