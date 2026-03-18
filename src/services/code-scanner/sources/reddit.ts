/**
 * Reddit presale code scanner.
 * Uses Reddit OAuth (application-only) since unauthenticated .json endpoints
 * now return 403.
 *
 * Setup: Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env.local
 * Get these at https://www.reddit.com/prefs/apps (create a "script" app)
 */

import { extractCodes } from "../extract";

const SUBREDDITS = [
  "presale",
  "ConcertTickets",
  "concerts",
  "TicketMasterPresale",
];

interface ScannedCode {
  code: string;
  confidence: "high" | "medium" | "low";
  source: string;
  sourceUrl: string;
  context: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get an OAuth token using application-only (client_credentials) flow.
 */
async function getRedditToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log("[code-scanner] Reddit OAuth not configured (REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET), skipping");
    return null;
  }

  // Use cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "User-Agent": "TicketScout/1.0",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    console.warn(`[code-scanner] Reddit OAuth failed: ${res.status}`);
    return null;
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 1 min early
  };
  return cachedToken.token;
}

/**
 * Search Reddit for presale codes related to an artist/event.
 */
export async function searchReddit(
  artistName: string,
  eventName?: string
): Promise<ScannedCode[]> {
  const token = await getRedditToken();
  if (!token) return [];

  const allCodes: ScannedCode[] = [];
  const seenCodes = new Set<string>();

  for (const sub of SUBREDDITS) {
    try {
      const codes = await searchSubreddit(token, sub, artistName, eventName);
      for (const c of codes) {
        if (!seenCodes.has(c.code)) {
          seenCodes.add(c.code);
          allCodes.push(c);
        }
      }
    } catch (err) {
      console.warn(`[code-scanner] Reddit r/${sub} search failed:`, err);
    }

    // Rate limit: ~1 req/sec with OAuth
    await new Promise((r) => setTimeout(r, 1200));
  }

  return allCodes;
}

async function searchSubreddit(
  token: string,
  subreddit: string,
  artistName: string,
  eventName?: string
): Promise<ScannedCode[]> {
  const query = encodeURIComponent(`${artistName} presale code`);
  const url = `https://oauth.reddit.com/r/${subreddit}/search?q=${query}&restrict_sr=on&sort=new&t=week&limit=10`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "TicketScout/1.0",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    console.warn(`[code-scanner] Reddit returned ${res.status} for r/${subreddit}`);
    return [];
  }

  const data = await res.json();
  const posts = (data?.data?.children ?? []).map(
    (c: { data: { title: string; selftext: string; permalink: string; created_utc: number; subreddit: string } }) => c.data
  );

  const results: ScannedCode[] = [];

  for (const post of posts) {
    // Only look at posts from the last 7 days
    const postAge = Date.now() / 1000 - post.created_utc;
    if (postAge > 7 * 24 * 60 * 60) continue;

    // Check if post is relevant to the artist
    const text = `${post.title}\n${post.selftext}`;
    const nameLower = artistName.toLowerCase();
    if (
      !text.toLowerCase().includes(nameLower) &&
      !(eventName && text.toLowerCase().includes(eventName.toLowerCase()))
    ) {
      continue;
    }

    // Extract codes from post text
    const extracted = extractCodes(text);
    for (const code of extracted) {
      results.push({
        code: code.code,
        confidence: code.confidence,
        source: `reddit/r/${post.subreddit}`,
        sourceUrl: `https://reddit.com${post.permalink}`,
        context: code.context,
      });
    }

    // Also check top comments
    try {
      const comments = await fetchTopComments(token, post.permalink);
      for (const comment of comments) {
        const commentCodes = extractCodes(comment.body);
        for (const code of commentCodes) {
          if (!results.some((r) => r.code === code.code)) {
            results.push({
              code: code.code,
              confidence: code.confidence,
              source: `reddit/r/${post.subreddit}`,
              sourceUrl: `https://reddit.com${post.permalink}`,
              context: code.context,
            });
          }
        }
      }
    } catch {
      // Comments are bonus — don't fail if we can't get them
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  return results;
}

async function fetchTopComments(
  token: string,
  permalink: string
): Promise<{ body: string }[]> {
  const url = `https://oauth.reddit.com${permalink}?limit=20&sort=top`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "TicketScout/1.0",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const commentListing = data?.[1]?.data?.children ?? [];
  return commentListing
    .filter((c: { kind: string }) => c.kind === "t1")
    .map((c: { data: { body: string } }) => ({ body: c.data.body }))
    .slice(0, 15);
}
