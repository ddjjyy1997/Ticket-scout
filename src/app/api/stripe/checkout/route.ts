import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";
import Stripe from "stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const { priceId } = await request.json().catch(() => ({ priceId: null }));
  if (!priceId) {
    return NextResponse.json({ error: "priceId is required" }, { status: 400 });
  }

  const sub = await getUserSubscription(session.user.id);
  if (!sub) {
    return NextResponse.json({ error: "No subscription record found" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Calculate remaining trial days
  let trialDays: number | undefined;
  if (sub.status === "trialing" && sub.trialEndsAt) {
    const remaining = Math.ceil(
      (sub.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (remaining > 0) trialDays = remaining;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: sub.stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(trialDays ? { subscription_data: { trial_period_days: trialDays } } : {}),
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url: `${appUrl}/settings?billing=cancelled`,
    metadata: { userId: session.user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
