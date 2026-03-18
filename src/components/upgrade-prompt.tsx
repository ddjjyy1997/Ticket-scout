"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  feature: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, compact }: UpgradePromptProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          <Link href="/settings" className="font-medium text-primary hover:underline">
            Upgrade to Pro
          </Link>
          {" "}to unlock {feature}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/20 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-1 text-sm font-semibold">Pro Feature</h3>
      <p className="mb-4 max-w-xs text-xs text-muted-foreground">
        Upgrade to TicketScout Pro to access {feature}. Try free for 7 days.
      </p>
      <Link
        href="/settings"
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Upgrade to Pro — $19/mo
      </Link>
    </div>
  );
}
