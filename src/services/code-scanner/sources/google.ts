/**
 * Google Custom Search presale code scanner.
 * Uses Google Custom Search JSON API (100 free queries/day).
 *
 * Setup:
 * 1. Create a Custom Search Engine at https://cse.google.com/
 * 2. Get API key from https://console.cloud.google.com/
 * 3. Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX in .env.local
 */

import { extractCodes } from "../extract";

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface ScannedCode {
  code: string;
  confidence: "high" | "medium" | "low";
  source: string;
  sourceUrl: string;
  context: string;
}

/**
 * Search Google for presale codes related to an artist.
 * Returns empty array if Google API keys aren't configured.
 */
export async function searchGoogle(
  artistName: string
): Promise<ScannedCode[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    console.log("[code-scanner] Google Custom Search not configured, skipping");
    return [];
  }

  const queries = [
    `${artistName} presale code 2025`,
    `${artistName} presale code 2026`,
    `${artistName} ticketmaster presale code`,
  ];

  const allCodes: ScannedCode[] = [];
  const seenCodes = new Set<string>();

  for (const query of queries) {
    try {
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("cx", cx);
      url.searchParams.set("q", query);
      url.searchParams.set("num", "5");
      // Prefer recent results
      url.searchParams.set("dateRestrict", "w1"); // last week

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        console.warn(`[code-scanner] Google returned ${res.status}`);
        continue;
      }

      const data = await res.json();
      const items: GoogleSearchResult[] = data.items ?? [];

      for (const item of items) {
        // Extract codes from title + snippet
        const text = `${item.title}\n${item.snippet}`;
        const extracted = extractCodes(text);

        for (const code of extracted) {
          if (!seenCodes.has(code.code)) {
            seenCodes.add(code.code);
            allCodes.push({
              code: code.code,
              confidence: code.confidence,
              source: "google",
              sourceUrl: item.link,
              context: code.context,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[code-scanner] Google search failed:`, err);
    }
  }

  return allCodes;
}
