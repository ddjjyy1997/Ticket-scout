import "next-auth";
import "@auth/core/jwt";

declare module "next-auth" {
  interface User {
    role?: string;
    plan?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    plan?: string;
  }
}

// Event status types
export type EventStatus =
  | "announced"
  | "onsale"
  | "offsale"
  | "cancelled"
  | "postponed"
  | "rescheduled"
  | "past";

export type OnsaleWindowType =
  | "presale"
  | "general"
  | "amex"
  | "fan_club"
  | "spotify"
  | "artist"
  | "venue"
  | "other";

export type WatchlistItemType = "event" | "artist" | "venue";

export type NotificationType =
  | "onsale_alert"
  | "price_drop"
  | "new_event"
  | "watchlist_match"
  | "presale_code"
  | "onsale_reminder";

export type ScanRunType = "full_scan" | "venue_scan" | "resale_enrich";

export type ScanStatus = "running" | "completed" | "failed" | "partial";

// Score color mapping
export function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

export function getScoreBg(score: number | null): string {
  if (score === null) return "bg-muted";
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 60) return "bg-blue-50 text-blue-700 border-blue-200";
  if (score >= 40) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export function getScoreLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Moderate";
  return "Low";
}
