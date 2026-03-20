"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function CheckoutGate({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // After Stripe checkout returns with ?welcome=true, refresh the session
  useEffect(() => {
    if (searchParams.get("welcome") === "true" && status === "authenticated") {
      setRefreshing(true);
      // Force JWT refresh so needsCheckout gets recalculated from DB
      update().then(() => {
        setRefreshing(false);
      });
    }
  }, [searchParams, status, update]);

  useEffect(() => {
    if (status !== "authenticated" || redirecting || refreshing) return;

    // Skip if returning from checkout
    if (searchParams.get("welcome") === "true") return;
    if (searchParams.get("billing") === "success") return;

    const user = session?.user as { needsCheckout?: boolean } | undefined;
    if (!user?.needsCheckout) return;

    setRedirecting(true);

    // Redirect to Stripe checkout for trial with card required
    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trial: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          setRedirecting(false);
        }
      })
      .catch(() => {
        setRedirecting(false);
      });
  }, [session, status, redirecting, refreshing, searchParams]);

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
