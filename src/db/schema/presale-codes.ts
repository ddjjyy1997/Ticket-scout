import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { events, onsaleWindows } from "./events";
import { users } from "./auth";

export const presaleCodes = pgTable(
  "presale_codes",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    onsaleWindowId: integer("onsale_window_id").references(
      () => onsaleWindows.id,
      { onDelete: "set null" }
    ),
    code: text("code").notNull(),
    source: text("source").notNull().default("user"), // 'admin' | 'user' | 'scraped'
    submittedBy: text("submitted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    confirmedWorking: integer("confirmed_working").notNull().default(0),
    confirmedNotWorking: integer("confirmed_not_working").notNull().default(0),
    confidence: numeric("confidence").default("0"),
    status: text("status").notNull().default("pending"), // 'pending' | 'verified' | 'expired' | 'fake'
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("presale_codes_event_id_idx").on(table.eventId),
    index("presale_codes_onsale_window_id_idx").on(table.onsaleWindowId),
    index("presale_codes_status_idx").on(table.status),
    unique("presale_codes_event_code_unique").on(table.eventId, table.code),
  ]
);

export const presaleCodesRelations = relations(presaleCodes, ({ one, many }) => ({
  event: one(events, {
    fields: [presaleCodes.eventId],
    references: [events.id],
  }),
  onsaleWindow: one(onsaleWindows, {
    fields: [presaleCodes.onsaleWindowId],
    references: [onsaleWindows.id],
  }),
  submitter: one(users, {
    fields: [presaleCodes.submittedBy],
    references: [users.id],
  }),
  votes: many(presaleCodeVotes),
}));

export const presaleCodeVotes = pgTable(
  "presale_code_votes",
  {
    id: serial("id").primaryKey(),
    codeId: integer("code_id")
      .notNull()
      .references(() => presaleCodes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vote: text("vote").notNull(), // 'working' | 'not_working'
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("presale_code_votes_user_code_unique").on(table.codeId, table.userId),
    index("presale_code_votes_code_id_idx").on(table.codeId),
  ]
);

export const presaleCodeVotesRelations = relations(
  presaleCodeVotes,
  ({ one }) => ({
    code: one(presaleCodes, {
      fields: [presaleCodeVotes.codeId],
      references: [presaleCodes.id],
    }),
    user: one(users, {
      fields: [presaleCodeVotes.userId],
      references: [users.id],
    }),
  })
);
