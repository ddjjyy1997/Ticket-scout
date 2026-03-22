import Link from "next/link";
import { Check } from "lucide-react";

const allFeatures = [
  "Track 1,000+ Events Across North America",
  "Presale & Onsale Alerts",
  "Event Calendar View",
  "Artist & Venue Watchlist",
  "Buy/Sell Score Analysis",
  "Unlimited Saved Views",
  "Community Presale Codes",
  "Email & SMS Reminders",
  "Portfolio Tracker (P&L)",
  "Priority Scoring Updates",
];

export function PricingTable() {
  return (
    <div className="mx-auto max-w-md">
      <div className="relative rounded-2xl border-2 border-primary bg-card p-8">
        <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
          Early Access
        </div>
        <h3 className="text-lg font-semibold">All Features</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything included — no limits
        </p>
        <div className="mt-6">
          <span className="text-4xl font-bold">$0</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Free during Early Access
        </p>
        <Link
          href="/signup"
          className="mt-6 flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Join Free
        </Link>
        <ul className="mt-8 space-y-3">
          {allFeatures.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-sm">{f}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          We&apos;re in early access. All features are free while we grow. Pro pricing coming later.
        </p>
      </div>
    </div>
  );
}
