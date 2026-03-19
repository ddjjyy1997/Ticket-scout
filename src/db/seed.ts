import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { venues } from "./schema/venues";
import { VENUES } from "../lib/constants";
import { config } from "dotenv";

config({ path: ".env.local" });

// Map city to province
const CITY_PROVINCE: Record<string, string> = {
  Toronto: "ON", Hamilton: "ON", Kitchener: "ON", London: "ON",
  Vancouver: "BC", Victoria: "BC",
  Montreal: "QC", "Quebec City": "QC",
  Calgary: "AB", Edmonton: "AB",
  Ottawa: "ON", Winnipeg: "MB",
  Halifax: "NS", Saskatoon: "SK", Regina: "SK",
};

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Seeding Canadian venues...");

  for (const venue of VENUES) {
    if (!venue.tmVenueId) continue;
    await db
      .insert(venues)
      .values({
        name: venue.name,
        slug: venue.slug,
        city: venue.city,
        province: CITY_PROVINCE[venue.city] ?? null,
        country: "CA",
        capacity: venue.capacity,
        tmVenueId: venue.tmVenueId,
      })
      .onConflictDoNothing();

    console.log(`  ✓ ${venue.city} — ${venue.name}`);
  }

  console.log("\nSeed complete!");
}

seed().catch(console.error);
