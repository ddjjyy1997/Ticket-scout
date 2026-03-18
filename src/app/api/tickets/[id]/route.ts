import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userTickets } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticketId = parseInt(id);
  if (isNaN(ticketId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.section !== undefined) updates.section = body.section || null;
  if (body.row !== undefined) updates.row = body.row || null;
  if (body.seat !== undefined) updates.seat = body.seat || null;
  if (body.quantity !== undefined) updates.quantity = body.quantity;
  if (body.purchasePrice !== undefined)
    updates.purchasePrice = String(body.purchasePrice);
  if (body.notes !== undefined) updates.notes = body.notes || null;
  if (body.source !== undefined) updates.source = body.source || null;

  const [updated] = await db
    .update(userTickets)
    .set(updates)
    .where(
      and(eq(userTickets.id, ticketId), eq(userTickets.userId, session.user.id))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticketId = parseInt(id);
  if (isNaN(ticketId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(userTickets)
    .where(
      and(eq(userTickets.id, ticketId), eq(userTickets.userId, session.user.id))
    )
    .returning({ id: userTickets.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
