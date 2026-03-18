import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { venues } from "./schema/venues";
import { TORONTO_VENUES } from "../lib/constants";
import { config } from "dotenv";

config({ path: ".env.local" });

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Seeding Toronto venues...");

  for (const venue of TORONTO_VENUES) {
    await db
      .insert(venues)
      .values({
        name: venue.name,
        slug: venue.slug,
        city: "Toronto",
        province: "ON",
        country: "CA",
        capacity: venue.capacity,
        tmVenueId: venue.tmVenueId ?? null,
      })
      .onConflictDoNothing();

    console.log(`  ✓ ${venue.name}`);
  }

  console.log("\nSeed complete!");
}

seed().catch(console.error);
