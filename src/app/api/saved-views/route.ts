import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { savedViews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserPlan } from "@/lib/subscription";
import { PLANS } from "@/lib/plans";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const views = await db
    .select()
    .from(savedViews)
    .where(eq(savedViews.userId, session.user.id))
    .orderBy(desc(savedViews.updatedAt));

  return NextResponse.json({ views });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, filters, notifyEnabled } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Check plan limits
  const role = (session.user as { role?: string }).role;
  const plan = await getUserPlan(session.user.id, role);
  const limit = PLANS[plan].maxSavedViews;

  if (limit !== Infinity) {
    const existing = await db
      .select({ id: savedViews.id })
      .from(savedViews)
      .where(eq(savedViews.userId, session.user.id));

    if (existing.length >= limit) {
      return NextResponse.json(
        {
          error: `Free plan allows up to ${limit} saved views. Upgrade to Pro for unlimited.`,
          code: "upgrade_required",
        },
        { status: 403 }
      );
    }
  }

  try {
    const [view] = await db
      .insert(savedViews)
      .values({
        userId: session.user.id,
        name: name.trim(),
        filters: filters ?? {},
        notifyEnabled: notifyEnabled ?? false,
      })
      .returning();

    return NextResponse.json({ view });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("unique")) {
      return NextResponse.json(
        { error: "A view with this name already exists" },
        { status: 409 }
      );
    }
    throw e;
  }
}
