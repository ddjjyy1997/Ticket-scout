import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { onsaleWindows } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/admin/presale-signup
 * Admin sets/updates a signup URL for a specific onsale window
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.windowId || typeof body.windowId !== "number") {
    return NextResponse.json({ error: "windowId required" }, { status: 400 });
  }

  const signupUrl = typeof body.signupUrl === "string" ? body.signupUrl.trim() || null : null;

  const [updated] = await db
    .update(onsaleWindows)
    .set({ signupUrl })
    .where(eq(onsaleWindows.id, body.windowId))
    .returning({ id: onsaleWindows.id, signupUrl: onsaleWindows.signupUrl });

  if (!updated) {
    return NextResponse.json({ error: "Window not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...updated });
}

/**
 * POST /api/admin/presale-signup/bulk
 * Bulk update signup URLs from admin
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.updates)) {
    return NextResponse.json({ error: "updates[] required" }, { status: 400 });
  }

  let count = 0;
  for (const u of body.updates) {
    if (typeof u.windowId !== "number") continue;
    const signupUrl = typeof u.signupUrl === "string" ? u.signupUrl.trim() || null : null;
    await db
      .update(onsaleWindows)
      .set({ signupUrl })
      .where(eq(onsaleWindows.id, u.windowId));
    count++;
  }

  return NextResponse.json({ ok: true, updated: count });
}
