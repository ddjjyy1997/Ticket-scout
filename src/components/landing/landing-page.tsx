import Link from "next/link";
import {
  Bell,
  Ticket,
  BarChart3,
  Shield,
  Zap,
  Wallet,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { LandingHeader } from "./header";
import { LandingFooter } from "./footer";
import { PricingTable } from "./pricing-table";

const FEATURES = [
  {
    icon: Bell,
    title: "Presale Alerts",
    description:
      "Get notified 30 minutes before presales open. Email + in-app reminders so you never miss a drop.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Ticket,
    title: "Presale Codes",
    description:
      "Community-sourced presale codes with confidence voting. Know which codes actually work.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Resale Analysis",
    description:
      "Buy/Sell scoring powered by real SeatGeek data. Know when to buy and when to flip.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Zap,
    title: "Smart Notifications",
    description:
      "Watchlist your favorite artists and venues. Get alerts the moment new events are announced.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Shield,
    title: "Event Discovery",
    description:
      "1,000+ Toronto events tracked daily from Ticketmaster. Music, sports, and more — all in one place.",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: Wallet,
    title: "Portfolio Tracker",
    description:
      "Log your purchased tickets, track live resale values, and get sell recommendations with P&L.",
    color: "bg-pink-50 text-pink-600",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create Your Account",
    description: "Sign up in 30 seconds. Try Pro free for 7 days — cancel anytime.",
  },
  {
    step: "02",
    title: "Set Your Alerts",
    description: "Watch your favorite artists, venues, and events. We'll track presales for you.",
  },
  {
    step: "03",
    title: "Never Miss a Presale",
    description: "Get codes, signup links, and reminders delivered right before each presale opens.",
  },
];

const FAQ = [
  {
    q: "What events does TicketScout track?",
    a: "We track all events at major Toronto venues including Scotiabank Arena, Rogers Centre, Massey Hall, History, Danforth Music Hall, and more. Both music and sports.",
  },
  {
    q: "How do presale codes work?",
    a: "Our community submits presale codes they find, and other users vote on whether they work. Codes with high confidence scores are highlighted so you know which ones to trust.",
  },
  {
    q: "What's the Buy/Sell Score?",
    a: "Our scoring engine analyzes venue capacity, genre demand, artist popularity, resale market data, and timing to give you a 0-100 score for buying and selling tickets.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Pro subscriptions can be cancelled at any time. You'll keep access until the end of your billing period.",
  },
  {
    q: "Do you sell tickets?",
    a: "No. TicketScout is an intelligence tool. We help you find the best deals and time your purchases — you buy directly from Ticketmaster, SeatGeek, or other platforms.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-3.5 w-3.5" />
              Tracking 1,000+ Toronto events daily
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Never Miss a{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                Presale
              </span>{" "}
              Again
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              TicketScout tracks every presale, onsale, and resale opportunity across Toronto.
              Get codes, alerts, and buy/sell scores — all before anyone else.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#features"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-border px-6 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                See How It Works
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              7-day free Pro trial. Cancel anytime.
            </p>
          </div>

          {/* Hero image - concert crowd */}
          <div className="mt-16 overflow-hidden rounded-xl border border-border/50 shadow-2xl shadow-primary/10">
            <img
              src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=600&fit=crop&q=80"
              alt="Concert crowd"
              className="h-64 w-full object-cover sm:h-80 lg:h-96"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/50 bg-muted/20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything You Need to Scout Tickets
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From presale codes to resale analysis — TicketScout gives you the edge.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className={`inline-flex rounded-lg p-2.5 ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get set up in minutes. Start catching presales today.
            </p>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / stats */}
      <section className="border-y border-border/50 bg-primary/5 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 text-center sm:grid-cols-4 sm:px-6">
          {[
            { value: "1,000+", label: "Events Tracked" },
            { value: "50+", label: "Toronto Venues" },
            { value: "Daily", label: "Presale Scans" },
            { value: "Free", label: "To Get Started" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-primary sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when you're ready.
            </p>
          </div>
          <div className="mt-14 mx-auto max-w-3xl">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 bg-muted/20 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 space-y-4">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium">
                  {f.q}
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <img src="/logo.png" alt="TicketScout" className="object-contain mx-auto h-16 w-16" />
          <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
            Ready to Scout Your Next Show?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join TicketScout and get presale codes, alerts, and resale analysis for every
            major event in Toronto.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
