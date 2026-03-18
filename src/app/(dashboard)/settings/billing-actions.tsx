"use client";

import { useState } from "react";
import { PRO_PRICE, STRIPE_CONFIG } from "@/lib/plans";

interface BillingActionsProps {
  plan: string;
  status: string | null;
  hasStripeSubscription: boolean;
  stripeConfigured: boolean;
}

export function BillingActions({
  plan,
  status,
  hasStripeSubscription,
  stripeConfigured,
}: BillingActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (interval: "monthly" | "yearly") => {
    setLoading(interval);
    setError(null);
    try {
      const priceId =
        interval === "monthly"
          ? STRIPE_CONFIG.proMonthlyPriceId
          : STRIPE_CONFIG.proYearlyPriceId;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create checkout");

      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to open portal");

      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  };

  // Already active Pro with Stripe subscription — show manage button
  if (plan === "pro" && hasStripeSubscription && status === "active") {
    return (
      <div className="space-y-2">
        <button
          onClick={handlePortal}
          disabled={loading === "portal"}
          className="inline-flex items-center rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80 disabled:opacity-50"
        >
          {loading === "portal" ? "Loading…" : "Manage Subscription"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Trialing or free — show upgrade options
  if (plan === "free" || status === "trialing" || status === "expired" || status === "cancelled") {
    return (
      <div className="space-y-3">
        {!stripeConfigured && (
          <p className="text-xs text-amber-500">
            Stripe is not configured. Set STRIPE_PRO_MONTHLY_PRICE_ID and
            STRIPE_PRO_YEARLY_PRICE_ID environment variables to enable billing.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleCheckout("monthly")}
            disabled={!!loading || !stripeConfigured}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading === "monthly"
              ? "Loading…"
              : `Upgrade — $${PRO_PRICE.monthly}/mo`}
          </button>
          <button
            onClick={() => handleCheckout("yearly")}
            disabled={!!loading || !stripeConfigured}
            className="inline-flex items-center rounded-md border border-primary bg-transparent px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {loading === "yearly"
              ? "Loading…"
              : `Upgrade — $${PRO_PRICE.yearly}/yr (save $${PRO_PRICE.monthly * 12 - PRO_PRICE.yearly})`}
          </button>
        </div>

        {status === "trialing" && (
          <p className="text-xs text-muted-foreground">
            Add a payment method to continue after your trial ends. Your trial features stay active until then.
          </p>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return null;
}
