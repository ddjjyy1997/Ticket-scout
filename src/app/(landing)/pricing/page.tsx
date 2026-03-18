import { PricingTable } from "@/components/landing/pricing-table";

export default function PricingPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you need presale codes, reminders, and portfolio tracking.
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-3xl">
          <PricingTable />
        </div>

        {/* Billing FAQ */}
        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-center text-2xl font-bold">Billing FAQ</h2>
          <div className="mt-8 space-y-4">
            {[
              {
                q: "Can I try Pro for free?",
                a: "Yes! Every new account gets a 7-day free trial of Pro. Add a payment method to start — you won't be charged until your trial ends.",
              },
              {
                q: "What happens when my trial ends?",
                a: "You'll be downgraded to the Free plan. You keep access to all your data — you just lose Pro features like presale codes and email reminders.",
              },
              {
                q: "Can I switch between monthly and yearly?",
                a: "Yes. You can switch billing periods at any time from your Settings page.",
              },
              {
                q: "How do I cancel?",
                a: "Go to Settings > Billing and click 'Manage Subscription'. You can cancel with one click. Access continues until the end of your current period.",
              },
            ].map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium">
                  {f.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-90">&#9654;</span>
                </summary>
                <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
