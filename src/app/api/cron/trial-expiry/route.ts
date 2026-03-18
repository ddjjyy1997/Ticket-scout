import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";
import { sendTrialWarningEmail, sendTrialExpiredEmail } from "@/lib/email/trial-emails";

export async function POST(request: Request) {
  // Verify cron secret
  const secret =
    request.headers.get("x-cron-secret") ??
    new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let expired = 0;
  let warned = 0;

  // 1. Expire trials that have passed
  const expiredTrials = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      email: users.email,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .where(
      and(
        eq(subscriptions.status, "trialing"),
        lte(subscriptions.trialEndsAt, now)
      )
    );

  for (const trial of expiredTrials) {
    await db
      .update(subscriptions)
      .set({ plan: "free", status: "expired", updatedAt: now })
      .where(eq(subscriptions.id, trial.id));

    try {
      await sendTrialExpiredEmail(trial.email);
    } catch {}
    expired++;
  }

  // 2. Send 3-day warning
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const threeDayWarnings = await db
    .select({ email: users.email })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .where(
      and(
        eq(subscriptions.status, "trialing"),
        lte(subscriptions.trialEndsAt, threeDaysFromNow),
        gte(subscriptions.trialEndsAt, twoDaysFromNow)
      )
    );

  for (const row of threeDayWarnings) {
    try {
      await sendTrialWarningEmail(row.email, 3);
      warned++;
    } catch {}
  }

  // 3. Send 1-day warning
  const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  const oneDayWarnings = await db
    .select({ email: users.email })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .where(
      and(
        eq(subscriptions.status, "trialing"),
        lte(subscriptions.trialEndsAt, oneDayFromNow),
        gte(subscriptions.trialEndsAt, now)
      )
    );

  for (const row of oneDayWarnings) {
    try {
      await sendTrialWarningEmail(row.email, 1);
      warned++;
    } catch {}
  }

  return NextResponse.json({ expired, warned });
}
