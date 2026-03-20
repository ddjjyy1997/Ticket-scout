import { NextResponse } from "next/server";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const cities = await db
    .selectDistinct({ city: venues.city, province: venues.province, country: venues.country })
    .from(venues)
    .where(eq(venues.isActive, 1))
    .orderBy(venues.city);

  const formatted = cities.map((c) => ({
    city: c.city,
    label: `${c.city}, ${c.province ?? ""}`.replace(/, $/, ""),
  }));

  return NextResponse.json(formatted);
}
