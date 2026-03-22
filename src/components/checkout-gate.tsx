"use client";

export function CheckoutGate({ children }: { children: React.ReactNode }) {
  // Free tier — no checkout required. Re-enable when ready to monetize.
  return <>{children}</>;
}
