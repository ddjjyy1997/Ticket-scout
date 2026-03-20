import {
  Bell,
  Ticket,
  BarChart3,
  Shield,
  Zap,
  Wallet,
  Calendar,
  Eye,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Shield,
    title: "Event Discovery",
    description:
      "TicketScout scans Ticketmaster daily for every event at 105+ venues across Canada and the US. Music, sports, comedy — everything tracked automatically so you don't have to search manually.",
    highlights: ["1,000+ events tracked", "105+ venues", "Music, Sports & Comedy", "Daily automated scans"],
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: Bell,
    title: "Presale Reminders",
    description:
      "Set your watchlist and we'll send you email and in-app notifications 30 minutes before any presale opens. Never miss the window again.",
    highlights: ["30-min early reminders", "Email + in-app", "Artist & venue alerts", "Customizable watchlist"],
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Ticket,
    title: "Presale Codes & Signup Links",
    description:
      "Our community shares and votes on presale codes. Plus, we auto-detect signup links for Spotify, Live Nation, Amex, and artist fan club presales.",
    highlights: ["Community-sourced codes", "Confidence voting", "Auto-detected signup URLs", "Admin-verified codes"],
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Buy/Sell Scoring",
    description:
      "Our scoring engine analyzes venue capacity, genre demand, artist data, onsale timing, and real SeatGeek resale prices to give you a 0-100 buy and sell score for every event.",
    highlights: ["0-100 Buy Score", "0-100 Sell Score", "SeatGeek integration", "Profit estimates"],
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Wallet,
    title: "Portfolio Tracker",
    description:
      "Log your purchased tickets and track their live resale value. See your total P&L, per-ticket profit, and get sell recommendations based on market conditions.",
    highlights: ["Track purchased tickets", "Live resale values", "P&L per ticket", "Sell recommendations"],
    color: "bg-pink-50 text-pink-600",
  },
  {
    icon: Calendar,
    title: "Calendar & Saved Views",
    description:
      "View all upcoming events on a calendar. Save your favorite filter combinations as views with optional email notifications when new events match.",
    highlights: ["Calendar view", "Save filter combos", "Email on new matches", "Quick view switching"],
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Features</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Every tool you need to find the best ticket deals across North America.
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`flex flex-col gap-8 lg:flex-row lg:items-center ${
                i % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1 space-y-4">
                <div className={`inline-flex rounded-lg p-3 ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold">{f.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {f.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <div className="rounded-xl border border-border/50 bg-muted/30 p-8">
                  <div className="flex items-center justify-center">
                    <div className={`rounded-2xl p-6 ${f.color}`}>
                      <f.icon className="h-16 w-16" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
