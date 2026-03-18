import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name || null,
        email,
        passwordHash,
        role: "user",
      })
      .returning({ id: users.id, email: users.email });

    // Create Stripe customer + trial subscription
    try {
      let stripeCustomerId = `local_${newUser.id}`;
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.create({
          email,
          name: name || undefined,
          metadata: { userId: newUser.id },
        });
        stripeCustomerId = customer.id;
      }

      await db.insert(subscriptions).values({
        userId: newUser.id,
        stripeCustomerId,
        plan: "pro",
        status: "trialing",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
    } catch (subErr) {
      console.error("Subscription creation error:", subErr);
      // User was still created — they just won't have a trial row
    }

    return NextResponse.json(
      { message: "Account created successfully", userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
