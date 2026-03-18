import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PLANS, type PlanId, type Feature } from "@/lib/plans";

export async function getUserSubscription(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return sub ?? null;
}

export async function getUserPlan(userId: string, role?: string): Promise<PlanId> {
  // Admins always get Pro
  if (role === "admin") return "pro";

  const sub = await getUserSubscription(userId);
  if (!sub) return "free";

  if (sub.status === "trialing" || sub.status === "active") return "pro";
  return "free";
}

export async function canAccess(
  userId: string,
  feature: Feature,
  role?: string
): Promise<boolean> {
  const plan = await getUserPlan(userId, role);
  return !!PLANS[plan][feature];
}

export class UpgradeRequiredError extends Error {
  feature: string;
  constructor(feature: string) {
    super(`Upgrade required: ${feature}`);
    this.feature = feature;
  }
}

export async function requirePro(userId: string, role?: string, feature = "this feature"): Promise<void> {
  const plan = await getUserPlan(userId, role);
  if (plan !== "pro") {
    throw new UpgradeRequiredError(feature);
  }
}
