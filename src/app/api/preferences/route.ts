import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  return NextResponse.json({
    emailNotifications: prefs?.emailNotifications ?? true,
    pushNotifications: prefs?.pushNotifications ?? true,
    notifyOnsale: prefs?.notifyOnsale ?? true,
    notifyPriceDrop: prefs?.notifyPriceDrop ?? true,
    notifyNewEvents: prefs?.notifyNewEvents ?? true,
    notifyCity: prefs?.notifyCity ?? null,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if ("emailNotifications" in body) updates.emailNotifications = !!body.emailNotifications;
  if ("pushNotifications" in body) updates.pushNotifications = !!body.pushNotifications;
  if ("notifyOnsale" in body) updates.notifyOnsale = !!body.notifyOnsale;
  if ("notifyPriceDrop" in body) updates.notifyPriceDrop = !!body.notifyPriceDrop;
  if ("notifyNewEvents" in body) updates.notifyNewEvents = !!body.notifyNewEvents;
  if ("notifyCity" in body) updates.notifyCity = body.notifyCity || null;

  // Upsert preferences
  const [existing] = await db
    .select({ id: userPreferences.id })
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

  if (existing) {
    await db
      .update(userPreferences)
      .set(updates)
      .where(eq(userPreferences.userId, session.user.id));
  } else {
    await db.insert(userPreferences).values({
      userId: session.user.id,
      ...updates,
    });
  }

  return NextResponse.json({ ok: true });
}
