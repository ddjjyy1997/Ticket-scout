import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";
import Stripe from "stripe";
import { STRIPE_CONFIG } from "@/lib/plans";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const { priceId, trial } = body;

  const sub = await getUserSubscription(session.user.id);
  if (!sub) {
    return NextResponse.json({ error: "No subscription record found" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Use monthly price as default for trial signup
  const resolvedPriceId = priceId || STRIPE_CONFIG.proMonthlyPriceId;
  if (!resolvedPriceId) {
    return NextResponse.json({ error: "No price configured" }, { status: 500 });
  }

  // For new trial signups: 7-day trial, card required, auto-charges after
  if (trial) {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: sub.stripeCustomerId,
      mode: "subscription",
      payment_method_collection: "always",
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: STRIPE_CONFIG.trialDays,
      },
      success_url: `${appUrl}/dashboard?welcome=true`,
      cancel_url: `${appUrl}/dashboard`,
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  }

  // For existing users upgrading: carry over remaining trial if applicable
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
    payment_method_collection: "always",
    line_items: [{ price: resolvedPriceId, quantity: 1 }],
    ...(trialDays ? { subscription_data: { trial_period_days: trialDays } } : {}),
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url: `${appUrl}/settings?billing=cancelled`,
    metadata: { userId: session.user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
