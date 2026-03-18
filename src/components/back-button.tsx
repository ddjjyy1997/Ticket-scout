"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ fallback = "/events" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        // If there's browser history, go back (preserves filters)
        // Otherwise navigate to fallback
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Events
    </button>
  );
}
