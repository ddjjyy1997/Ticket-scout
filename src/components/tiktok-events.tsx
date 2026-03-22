"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackCompleteRegistration, trackViewContent } from "@/lib/tiktok-pixel";

/**
 * Fires a CompleteRegistration event for Google OAuth users
 * who land on /dashboard?welcome=true after signing up.
 */
export function TrackGoogleSignup() {
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("welcome") === "true") {
      trackCompleteRegistration("google");
    }
  }, [params]);

  return null;
}

/**
 * Fires a ViewContent event when an event detail page loads.
 */
export function TrackEventView({
  eventName,
  eventId,
}: {
  eventName: string;
  eventId: string;
}) {
  useEffect(() => {
    trackViewContent(eventName, eventId);
  }, [eventName, eventId]);

  return null;
}
