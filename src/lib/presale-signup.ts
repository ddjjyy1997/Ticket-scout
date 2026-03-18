/**
 * Auto-detect presale type from Ticketmaster presale window name
 * and resolve known signup URLs for common presale types.
 */

import type { OnsaleWindowType } from "@/types";

// ── Presale type detection from window name ────────────────────────────

const TYPE_PATTERNS: { pattern: RegExp; type: OnsaleWindowType }[] = [
  { pattern: /spotify/i, type: "spotify" },
  { pattern: /amex|american\s*express/i, type: "amex" },
  { pattern: /fan\s*club|vip\s*(access|presale)|members?\s*(only|presale)|official\s*fan/i, type: "fan_club" },
  { pattern: /artist\s*presale/i, type: "artist" },
  { pattern: /venue\s*presale/i, type: "venue" },
  { pattern: /live\s*nation|live\s*insider/i, type: "presale" },  // LN presales
  { pattern: /ticketmaster/i, type: "presale" },
];

export function detectPresaleType(windowName: string | null): OnsaleWindowType {
  if (!windowName) return "presale";
  for (const { pattern, type } of TYPE_PATTERNS) {
    if (pattern.test(windowName)) return type;
  }
  return "presale";
}

// ── Known signup URLs for common presale types ─────────────────────────

interface SignupInfo {
  label: string;
  url: string;
  description: string;
}

const KNOWN_SIGNUPS: Record<string, SignupInfo> = {
  spotify: {
    label: "Spotify",
    url: "https://www.spotify.com/us/signup",
    description: "Sign up for Spotify to qualify for presale access",
  },
  amex: {
    label: "Get an Amex Card",
    url: "https://americanexpress.com/en-ca/referral/cobalt?ref=dYLANYfh1C&XLINK=MYCP",
    description: "Sign up for an American Express card to access Amex presales",
  },
  fan_club: {
    label: "Fan Club Signup",
    url: "", // needs per-artist URL — admin sets via event page
    description: "Sign up for the artist's official fan club",
  },
  live_nation: {
    label: "Live Nation All Access",
    url: "https://www.livenation.com/allaccess",
    description: "Free Live Nation All Access account required",
  },
  ticketmaster: {
    label: "Ticketmaster",
    url: "", // varies — admin sets per-event
    description: "Ticketmaster account required",
  },
};

// Patterns in window name that map to a known signup
const SIGNUP_NAME_PATTERNS: { pattern: RegExp; key: string }[] = [
  { pattern: /spotify/i, key: "spotify" },
  { pattern: /amex|american\s*express/i, key: "amex" },
  { pattern: /live\s*nation|live\s*insider/i, key: "live_nation" },
  { pattern: /fan\s*club|official\s*fan|vip\s*access|members?\s*(only|presale)/i, key: "fan_club" },
];

/**
 * Try to resolve a signup URL for a presale window based on its name.
 * For artist presales, generates a Google search link to find the signup page.
 * Returns null if no known signup, or the URL is empty (needs admin input).
 */
export function resolveSignupUrl(
  windowName: string | null,
  artistName?: string | null
): string | null {
  if (!windowName) return null;

  for (const { pattern, key } of SIGNUP_NAME_PATTERNS) {
    if (pattern.test(windowName)) {
      const info = KNOWN_SIGNUPS[key];
      return info?.url || null;
    }
  }

  // For artist presales or any presale with an artist, generate a Google search
  if (artistName && /artist|fan|presale/i.test(windowName)) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${artistName} presale signup`)}`;
  }

  return null;
}

/**
 * Get display info for a presale signup.
 * For artist presales, generates a Google search link to help users find the signup page.
 */
export function getSignupInfo(
  windowName: string | null,
  artistName?: string | null
): SignupInfo | null {
  if (!windowName) return null;

  for (const { pattern, key } of SIGNUP_NAME_PATTERNS) {
    if (pattern.test(windowName)) {
      return KNOWN_SIGNUPS[key] ?? null;
    }
  }

  // For artist presales, provide a Google search link
  if (artistName && /artist|fan|presale/i.test(windowName)) {
    return {
      label: `${artistName} Presale`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${artistName} presale signup`)}`,
      description: `Search for ${artistName}'s presale signup page`,
    };
  }

  return null;
}

// ── Badge colors by presale type ───────────────────────────────────────

export const PRESALE_TYPE_COLORS: Record<string, string> = {
  general: "bg-emerald-50 text-emerald-700 border-emerald-200",
  presale: "bg-purple-50 text-purple-700 border-purple-200",
  amex: "bg-blue-50 text-blue-700 border-blue-200",
  fan_club: "bg-pink-50 text-pink-700 border-pink-200",
  spotify: "bg-green-50 text-green-700 border-green-200",
  artist: "bg-orange-50 text-orange-700 border-orange-200",
  venue: "bg-cyan-50 text-cyan-700 border-cyan-200",
  other: "bg-muted text-muted-foreground",
};
