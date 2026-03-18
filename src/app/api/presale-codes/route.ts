import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCodesForEvent, submitCode } from "@/db/queries/presale-codes";
import { requirePro } from "@/lib/subscription";
import { UpgradeRequiredError } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  // Pro-only: check access
  const role = (session.user as { role?: string }).role;
  try {
    await requirePro(session.user.id, role, "presale codes");
  } catch (err) {
    if (err instanceof UpgradeRequiredError) {
      return NextResponse.json(
        { error: err.message, code: "upgrade_required" },
        { status: 403 }
      );
    }
    throw err;
  }

  const codes = await getCodesForEvent(Number(eventId), session.user.id);
  return NextResponse.json({ codes });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  try {
    await requirePro(session.user.id, role, "presale codes");
  } catch (err) {
    if (err instanceof UpgradeRequiredError) {
      return NextResponse.json(
        { error: err.message, code: "upgrade_required" },
        { status: 403 }
      );
    }
    throw err;
  }

  const body = await request.json().catch(() => ({}));
  const { eventId, onsaleWindowId, code, notes } = body;

  if (!eventId || !code || typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json(
      { error: "eventId and code are required" },
      { status: 400 }
    );
  }

  const source = role === "admin" ? "admin" : "user";

  try {
    const result = await submitCode({
      eventId: Number(eventId),
      onsaleWindowId: onsaleWindowId ? Number(onsaleWindowId) : null,
      code: code.trim(),
      source: source as "admin" | "user",
      submittedBy: session.user.id,
      notes: notes ?? null,
    });

    return NextResponse.json({ id: result.id, status: source === "admin" ? "verified" : "pending" });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("unique")) {
      return NextResponse.json(
        { error: "This code has already been submitted for this event" },
        { status: 409 }
      );
    }
    throw e;
  }
}
