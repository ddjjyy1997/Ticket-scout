/**
 * Web scrape fallback for presale codes.
 * Searches publicly accessible presale code sites and forums.
 * No API key required — uses plain HTML fetching + regex extraction.
 */

import { extractCodes } from "../extract";

interface ScannedCode {
  code: string;
  confidence: "high" | "medium" | "low";
  source: string;
  sourceUrl: string;
  context: string;
}

// Known sites that aggregate presale codes
const SEARCH_URLS = [
  // Reddit search (old.reddit.com sometimes works without auth)
  (artist: string) =>
    `https://old.reddit.com/r/presale/search?q=${encodeURIComponent(artist + " presale code")}&restrict_sr=on&sort=new&t=week`,
  // Google web search (parse snippets)
  (artist: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(artist + " presale code " + new Date().getFullYear())}`,
];

/**
 * Scrape the web for presale codes.
 * Best-effort — works without any API keys.
 */
export async function searchWebScrape(
  artistName: string
): Promise<ScannedCode[]> {
  const allCodes: ScannedCode[] = [];
  const seenCodes = new Set<string>();

  // Try Google web search (extract from snippets in HTML)
  try {
    const googleCodes = await scrapeGoogleSearch(artistName);
    for (const c of googleCodes) {
      if (!seenCodes.has(c.code)) {
        seenCodes.add(c.code);
        allCodes.push(c);
      }
    }
  } catch (err) {
    console.warn("[code-scanner] Web scrape Google failed:", err);
  }

  return allCodes;
}

async function scrapeGoogleSearch(
  artistName: string
): Promise<ScannedCode[]> {
  const year = new Date().getFullYear();
  const query = `${artistName} presale code ${year}`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    console.warn(`[code-scanner] Google web returned ${res.status}`);
    return [];
  }

  const html = await res.text();

  // Extract text snippets from Google results
  // Google wraps snippets in various elements — extract all visible text chunks
  const textChunks: string[] = [];

  // Remove HTML tags but keep text, split on result boundaries
  const stripped = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ");

  textChunks.push(stripped);

  const results: ScannedCode[] = [];

  for (const text of textChunks) {
    // Only look at parts mentioning the artist
    if (!text.toLowerCase().includes(artistName.toLowerCase())) continue;

    const extracted = extractCodes(text);
    for (const code of extracted) {
      results.push({
        code: code.code,
        confidence: code.confidence,
        source: "google-web",
        sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        context: code.context,
      });
    }
  }

  return results;
}
