import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.resumed":
      case "customer.subscription.paused": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        let status: string;
        switch (sub.status) {
          case "trialing": status = "trialing"; break;
          case "active": status = "active"; break;
          case "past_due": status = "past_due"; break;
          case "paused": status = "paused"; break;
          case "canceled":
          case "unpaid": status = "cancelled"; break;
          default: status = sub.status;
        }

        await db
          .update(subscriptions)
          .set({
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items?.data?.[0]?.price?.id ?? null,
            plan: "pro",
            status,
            currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));
        break;
      }

      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        await db
          .update(subscriptions)
          .set({
            plan: "free",
            status: "expired",
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));
        break;
      }

      case "customer.subscription.trial_will_end": {
        // Trial ending in 3 days — could send a reminder email here
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        console.log(`[webhook] Trial ending soon for customer ${customerId}`);
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await db
            .update(subscriptions)
            .set({ status: "active", plan: "pro", updatedAt: new Date() })
            .where(eq(subscriptions.stripeCustomerId, customerId));
        }
        break;
      }

      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await db
            .update(subscriptions)
            .set({ status: "past_due", updatedAt: new Date() })
            .where(eq(subscriptions.stripeCustomerId, customerId));
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  return NextResponse.json({ received: true });
}
