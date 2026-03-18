import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TicketsClient } from "./tickets-client";

export default async function TicketsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role;
  const plan = role === "admin" ? "pro" : ((session.user as { plan?: string }).plan ?? "free");

  if (plan !== "pro") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground">
            Track your purchased tickets and monitor resale value
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-lg font-medium">Pro Feature</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to Pro to track your ticket portfolio and get sell recommendations.
          </p>
          <a
            href="/settings"
            className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  return <TicketsClient />;
}
