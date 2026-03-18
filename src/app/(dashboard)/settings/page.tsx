import { auth } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";
import { PRO_PRICE, PLANS, STRIPE_CONFIG } from "@/lib/plans";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { BillingActions } from "./billing-actions";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sub = await getUserSubscription(session.user.id);
  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "admin";
  const plan = isAdmin ? "pro" : ((session.user as { plan?: string }).plan ?? "free");

  // Trial info
  let trialDaysLeft: number | null = null;
  if (sub?.status === "trialing" && sub.trialEndsAt) {
    trialDaysLeft = Math.max(
      0,
      Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }

  const statusLabel = getStatusLabel(sub?.status ?? null, isAdmin, trialDaysLeft);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>{statusLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                plan === "pro"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {plan === "pro" ? "Pro" : "Free"}
            </span>
            {trialDaysLeft !== null && trialDaysLeft > 0 && (
              <span className="text-sm text-amber-500 font-medium">
                {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in trial
              </span>
            )}
            {sub?.cancelAtPeriodEnd && (
              <span className="text-sm text-red-600 font-medium">
                Cancels at period end
              </span>
            )}
          </div>

          {sub?.currentPeriodEnd && sub.status === "active" && (
            <p className="text-xs text-muted-foreground">
              Current period ends{" "}
              {sub.currentPeriodEnd.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}

          <BillingActions
            plan={plan}
            status={sub?.status ?? null}
            hasStripeSubscription={!!sub?.stripeSubscriptionId}
            stripeConfigured={!!STRIPE_CONFIG.proMonthlyPriceId}
          />
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Comparison</CardTitle>
          <CardDescription>
            See what&apos;s included in each plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {/* Header */}
            <div className="font-medium text-muted-foreground">Feature</div>
            <div className="text-center font-semibold">Free</div>
            <div className="text-center font-semibold text-primary">
              Pro — ${PRO_PRICE.monthly}/mo
            </div>

            <div className="col-span-3 border-b border-border" />

            {/* Saved Views */}
            <div>Saved Views</div>
            <div className="text-center text-muted-foreground">
              {PLANS.free.maxSavedViews}
            </div>
            <div className="text-center">Unlimited</div>

            {/* Email Notifications */}
            <div>Email Notifications</div>
            <div className="flex justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex justify-center">
              <Check className="h-4 w-4 text-primary" />
            </div>

            {/* Presale Codes */}
            <div>Presale Codes</div>
            <div className="flex justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex justify-center">
              <Check className="h-4 w-4 text-primary" />
            </div>

            {/* SMS Notifications */}
            <div>SMS Notifications</div>
            <div className="flex justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex justify-center">
              <Check className="h-4 w-4 text-primary" />
            </div>

            {/* Priority Scoring */}
            <div>Priority Scoring</div>
            <div className="flex justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex justify-center">
              <Check className="h-4 w-4 text-primary" />
            </div>
          </div>

          {plan !== "pro" && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Start with a 14-day free trial. No credit card required.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusLabel(
  status: string | null,
  isAdmin: boolean,
  trialDaysLeft: number | null
): string {
  if (isAdmin) return "Admin account — all Pro features enabled";
  if (!status) return "No subscription — Free plan";
  switch (status) {
    case "trialing":
      return `Pro Trial${trialDaysLeft !== null ? ` — ${trialDaysLeft} days remaining` : ""}`;
    case "active":
      return "Pro — Active subscription";
    case "past_due":
      return "Pro — Payment past due";
    case "cancelled":
      return "Subscription cancelled — Free plan";
    case "expired":
      return "Trial expired — Free plan";
    default:
      return "Free plan";
  }
}
