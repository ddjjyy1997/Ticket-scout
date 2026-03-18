import {
  pgTable,
  serial,
  integer,
  numeric,
  text,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { events } from "./events";

export const eventScores = pgTable(
  "event_scores",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),

    // Buy Score (pre-onsale prediction)
    buyScore: numeric("buy_score"),
    buyConfidence: numeric("buy_confidence").notNull().default("0"),
    buyInputs: jsonb("buy_inputs").notNull().default("{}"),
    buyRecommendation: text("buy_recommendation"), // Strong Buy|Buy|Speculative|Pass|Avoid
    expectedRoiBand: text("expected_roi_band"), // low|medium|high

    // Sell Score (post-onsale resale evaluation)
    sellScore: numeric("sell_score"), // null if no SG data
    sellConfidence: numeric("sell_confidence").notNull().default("0"),
    sellInputs: jsonb("sell_inputs").notNull().default("{}"),
    sellRecommendation: text("sell_recommendation"), // Sell Now|Lean Sell|Hold|Monitor|Exit
    marketPhase: text("market_phase"), // pre_market|early_spike|healthy_climb|peak_zone|softening|late_risk|dead_market

    // Profit estimation
    profitEstimatePct: numeric("profit_estimate_pct"),
    profitEstimateAmt: numeric("profit_estimate_amt"), // in CAD

    calculatedAt: timestamp("calculated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("event_scores_event_id_unique").on(table.eventId)]
);

export const eventScoresRelations = relations(eventScores, ({ one }) => ({
  event: one(events, {
    fields: [eventScores.eventId],
    references: [events.id],
  }),
}));
