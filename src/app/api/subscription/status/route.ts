import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ needsCheckout: false });
  }

  const role = (session.user as { role?: string }).role;
  if (role === "admin") {
    return NextResponse.json({ needsCheckout: false });
  }

  const [sub] = await db
    .select({
      status: subscriptions.status,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  // Needs checkout if: no subscription, or trialing without a Stripe subscription (no card)
  const needsCheckout = !sub || (sub.status === "trialing" && !sub.stripeSubscriptionId);

  return NextResponse.json({ needsCheckout });
}
