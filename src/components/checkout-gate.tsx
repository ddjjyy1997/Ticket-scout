"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";

export function CheckoutGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [redirecting, setRedirecting] = useState(false);
  const [checked, setChecked] = useState(false);
  const checking = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || checked || checking.current) return;

    // Skip if returning from Stripe checkout
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("welcome") === "true" || params.get("billing") === "success") {
        setChecked(true);
        return;
      }
    }

    checking.current = true;

    // Check DB directly via API — no stale JWT issues
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.needsCheckout) {
          setRedirecting(true);
          // Redirect to Stripe checkout
          fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trial: true }),
          })
            .then((res) => res.json())
            .then((checkoutData) => {
              if (checkoutData.url) {
                window.location.href = checkoutData.url;
              } else {
                // Checkout failed — let them in
                setRedirecting(false);
                setChecked(true);
              }
            })
            .catch(() => {
              setRedirecting(false);
              setChecked(true);
            });
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        setChecked(true);
      });
  }, [status, checked]);

  if (redirecting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Setting up your free trial...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
