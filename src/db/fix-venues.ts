import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { venues } from "./schema/venues";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

const VENUE_FIXES: Record<string, string | null> = {
  "scotiabank-arena": "KovZpZAFFE1A",
  "rogers-centre": "KovZpa3Bbe",
  "budweiser-stage": "KovZpZAEkkIA", // Now RBC Amphitheatre
  "massey-hall": "KovZpZAFnlnA",
  "history-toronto": "KovZ917AJ4f",
  "echo-beach": "KovZpZAJ6EFA",
  "danforth-music-hall": "KovZpa3yBe",
  "coca-cola-coliseum": "KovZpZAJt7FA",
  "downsview-park": "KovZpZAFleeA",
  "queen-elizabeth-theatre-toronto": null,
};

async function fix() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Fixing venue IDs...\n");

  for (const [slug, tmId] of Object.entries(VENUE_FIXES)) {
    if (tmId) {
      await db
        .update(venues)
        .set({ tmVenueId: tmId })
        .where(eq(venues.slug, slug));
      console.log(`  ✓ ${slug} -> ${tmId}`);
    } else {
      console.log(`  - ${slug} -> no TM ID found`);
    }
  }

  console.log("\nDone!");
}

fix().catch(console.error);
