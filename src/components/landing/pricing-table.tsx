import Link from "next/link";
import { Check, X } from "lucide-react";

const features = [
  { name: "Track 1000+ Toronto Events", free: true, pro: true },
  { name: "Presale & Onsale Alerts", free: true, pro: true },
  { name: "Event Calendar View", free: true, pro: true },
  { name: "Artist & Venue Watchlist", free: true, pro: true },
  { name: "Buy/Sell Score Analysis", free: true, pro: true },
  { name: "Saved Views", free: "3 views", pro: "Unlimited" },
  { name: "Community Presale Codes", free: false, pro: true },
  { name: "Email & SMS Reminders", free: false, pro: true },
  { name: "Portfolio Tracker (P&L)", free: false, pro: true },
  { name: "Priority Scoring Updates", free: false, pro: true },
];

function FeatureCheck({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-muted-foreground">{value}</span>;
  }
  return value ? (
    <Check className="h-4 w-4 text-emerald-600" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/40" />
  );
}

export function PricingTable() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      {/* Free Plan */}
      <div className="rounded-2xl border border-border bg-card p-8">
        <h3 className="text-lg font-semibold">Free</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started with the basics
        </p>
        <div className="mt-6">
          <span className="text-4xl font-bold">$0</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <Link
          href="/signup"
          className="mt-6 flex h-11 items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Sign Up Free
        </Link>
        <ul className="mt-8 space-y-3">
          {features.map((f) => (
            <li key={f.name} className="flex items-center gap-3">
              <FeatureCheck value={f.free} />
              <span className={`text-sm ${!f.free ? "text-muted-foreground/60" : ""}`}>
                {f.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pro Plan */}
      <div className="relative rounded-2xl border-2 border-primary bg-card p-8">
        <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
          Most Popular
        </div>
        <h3 className="text-lg font-semibold">Pro</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to scout tickets
        </p>
        <div className="mt-6">
          <span className="text-4xl font-bold">$5</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          or $49/year (save 18%)
        </p>
        <Link
          href="/signup"
          className="mt-6 flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start 14-Day Free Trial
        </Link>
        <ul className="mt-8 space-y-3">
          {features.map((f) => (
            <li key={f.name} className="flex items-center gap-3">
              <FeatureCheck value={f.pro} />
              <span className="text-sm">{f.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
